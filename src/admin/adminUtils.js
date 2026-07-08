import { supabase } from "../supabase";

// ─── 付款計算（對應需求總文件 §5）──────────────────────────────
export function calcPayment(o){
  const total = Number(o.total) || 0;
  const depositPaid = Number(o.deposit_paid) || 0;
  const codReceived = Number(o.cod_received) || 0;
  const codAmount = total - depositPaid;          // 貨到付款金額
  const totalReceived = depositPaid + codReceived; // 已收總額
  const pending = total - totalReceived;           // 待收金額
  const method = o.payment_method || "full_payment";

  let paymentStatus, shippable;
  if (method === "full_payment") {
    if (totalReceived >= total) { paymentStatus = "已收齊"; shippable = "可出貨"; }
    else { paymentStatus = "未收齊（待補匯）"; shippable = "不可出貨"; }
  } else if (method === "deposit_cod") {
    if (depositPaid <= 0) { paymentStatus = "未付訂金"; shippable = "不可出貨"; }
    else if (codReceived >= codAmount && totalReceived >= total) { paymentStatus = "已收齊"; shippable = "已結清"; }
    else { paymentStatus = "訂金已付，尾款貨到待收"; shippable = "可出貨"; }
  } else { // full_cod
    if (codReceived >= codAmount && totalReceived >= total) { paymentStatus = "已收齊"; shippable = "已結清"; }
    else { paymentStatus = "全額貨到付款待收"; shippable = "可出貨"; }
  }
  return { total, depositPaid, codReceived, codAmount, totalReceived, pending, paymentStatus, shippable };
}

// 中文對照
export const PAYMENT_METHOD_LABEL = { full_payment:"一次付清", deposit_cod:"訂金＋尾款貨到", full_cod:"全額貨到付款" };
export const SHIPPING_LABEL = { pending:"未處理", preparing:"備貨中", shipped:"已寄出", arrived:"已到台", completed:"已完成", cancelled:"已取消" };
export const PURCHASE_LABEL = { unpurchased:"未採買", partial:"部分採買", purchased:"已採買", out_of_stock:"缺貨", partial_out_of_stock:"部分缺貨", cancelled:"已取消" };
export const ORDER_LABEL = { pending_review:"待審核", active:"進行中", cancelled:"已取消" };

export const STAGE_LABEL = { pending_review:"待審核", to_purchase:"待採買", purchased:"已採買", shipped:"已寄出", arrived:"已到台", cancelled:"已取消" };

// 套用訂單階段（訂單頁 / 客人頁共用）：改 orders + 觸發現貨出庫/釋放預約
export async function applyStage(order, stage){
  let patch = {};
  if (stage==="pending_review") patch = { status:"pending_review", shipping_status:"pending" };
  else if (stage==="to_purchase"||stage==="purchased") patch = { status:"active", shipping_status:"pending" };
  else if (stage==="shipped") patch = { status:"active", shipping_status:"shipped" };
  else if (stage==="arrived") patch = { status:"active", shipping_status:"arrived" };
  else if (stage==="cancelled") patch = { status:"cancelled" };
  await supabase.from("orders").update({ ...patch, updated_at:new Date().toISOString() }).eq("id", order.id);
  if (stage==="cancelled") await supabase.rpc("restore_stock", { p_order_id:order.id });
  if (stage==="shipped" || stage==="arrived") {
    await supabase.rpc("ship_order", { p_order_id:order.id });
    // 自動 LINE 通知客人（需已部署 send-line；失敗不擋流程；手動客人自動略過）
    const cid = order.customer_line_id || "";
    if (cid && !cid.startsWith("manual:")) {
      const msg = stage==="shipped"
        ? `📦 您的訂單 #${order.no} 已寄出囉！到台後會再通知您～`
        : `✈️ 您的訂單 #${order.no} 已到台！請至「出貨」頁查看取貨/結單資訊～`;
      supabase.functions.invoke("send-line", { body:{ customerIds:[cid], message:msg } }).catch(()=>{});
    }
  }
}

// 訂單流水線階段推導（訂單頁 / 統計卡共用）：待審核→待採買→已採買→已寄出→已到台/已取消
export const orderStage = (o) => {
  if (o.status === "cancelled") return "cancelled";
  if (o.status === "pending_review") return "pending_review";
  const ship = o.shipping_status || "pending";
  if (ship === "shipped") return "shipped";
  if (ship === "arrived" || ship === "completed") return "arrived";
  const items = o.items || [];
  const done = items.length > 0 && items.every(it => it.allocated_qty != null ? it.allocated_qty >= it.qty : it.purchase_status === "purchased");
  return done ? "purchased" : "to_purchase";
};

// ─── CSV ──────────────────────────────────────────────────────
export function toCSV(rows, headers){
  const esc = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = headers.map(h => esc(h.label)).join(",");
  const body = rows.map(r => headers.map(h => esc(h.get ? h.get(r) : r[h.key])).join(",")).join("\n");
  return "﻿" + head + "\n" + body;   // 前置 BOM，Excel 開中文不亂碼
}
export function downloadCSV(filename, content){
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── 上傳圖片到 Storage（需先建好對應 bucket）───────────────────
export async function uploadImage(file, bucket = "product-images"){
  const ext = file.name.split(".").pop();
  const path = `${Date.now()}-${Math.round(Math.random()*1e6)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl || "";
}
