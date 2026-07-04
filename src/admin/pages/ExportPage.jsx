import { useState } from "react";
import { supabase } from "../../supabase";
import { C } from "../../theme";
import { calcPayment, PAYMENT_METHOD_LABEL, SHIPPING_LABEL, PURCHASE_LABEL, toCSV, downloadCSV } from "../adminUtils";

export function ExportPage(){
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");

  const run = async (key, fn) => {
    setBusy(key); setMsg("");
    try { await fn(); setMsg("匯出完成 ✅"); }
    catch (e) { setMsg("匯出失敗：" + e.message); }
    setBusy("");
  };

  // 訂單報表
  const exportOrders = async () => {
    const { data, error } = await supabase.from("orders").select("*").order("created_at",{ascending:false});
    if (error) throw error;
    const rows = (data||[]).map(o => ({ ...o, ...calcPayment(o) }));
    const headers = [
      { label:"訂單編號", key:"no" },
      { label:"下單時間", get:o=>o.created_at?new Date(o.created_at).toLocaleString("zh-TW"):"" },
      { label:"客人姓名", key:"customer_name" },
      { label:"總金額", key:"total" },
      { label:"付款方式", get:o=>PAYMENT_METHOD_LABEL[o.payment_method]||o.payment_method },
      { label:"已收總額", get:o=>o.totalReceived },
      { label:"待收金額", get:o=>o.pending },
      { label:"付款狀態", get:o=>o.paymentStatus },
      { label:"可出貨狀態", get:o=>o.shippable },
      { label:"出貨狀態", get:o=>SHIPPING_LABEL[o.shipping_status]||o.shipping_status },
      { label:"物流單號", key:"tracking_no" },
      { label:"備註", key:"notes" },
    ];
    downloadCSV("訂單報表.csv", toCSV(rows, headers));
  };

  // 訂單明細
  const exportItems = async () => {
    const { data, error } = await supabase.from("order_items").select("*, orders(no, customer_name, status)");
    if (error) throw error;
    const rows = (data||[]).filter(it=>it.orders && it.orders.status!=="cancelled");
    const headers = [
      { label:"訂單編號", get:r=>r.orders?.no },
      { label:"客人姓名", get:r=>r.orders?.customer_name },
      { label:"商品名稱", key:"product_name" },
      { label:"規格", key:"spec" },
      { label:"數量", key:"qty" },
      { label:"單價", key:"price" },
      { label:"小計", get:r=>(r.price||0)*(r.qty||0) },
      { label:"採買狀態", get:r=>PURCHASE_LABEL[r.purchase_status]||r.purchase_status },
    ];
    downloadCSV("訂單明細.csv", toCSV(rows, headers));
  };

  // 配貨彙總
  const exportDistribution = async () => {
    const { data, error } = await supabase.from("distribution_summary").select("*");
    if (error) throw error;
    const headers = [
      { label:"商品名稱", key:"product_name" },
      { label:"規格", key:"spec" },
      { label:"總訂購", key:"total_qty" },
      { label:"已採買", key:"purchased_qty" },
      { label:"未採買", key:"unpurchased_qty" },
      { label:"缺貨", key:"out_of_stock_qty" },
      { label:"相關訂單數", key:"order_count" },
      { label:"相關訂單編號", get:r=>Array.isArray(r.order_nos)?r.order_nos.join("、"):r.order_nos },
      { label:"採買狀態", get:r=>PURCHASE_LABEL[r.summary_status]||r.summary_status },
    ];
    downloadCSV("配貨彙總採買清單.csv", toCSV(data||[], headers));
  };

  const card = (title, desc, key, fn) => (
    <div style={{background:C.surface,borderRadius:C.r,boxShadow:C.shadow,padding:20,display:"flex",alignItems:"center",gap:16}}>
      <div style={{flex:1}}>
        <div style={{fontSize:15,fontWeight:600}}>{title}</div>
        <div style={{fontSize:12,color:C.muted,marginTop:4}}>{desc}</div>
      </div>
      <button onClick={()=>run(key, fn)} disabled={!!busy}
        style={{background:C.accent,color:"#fff",border:"none",borderRadius:99,padding:"10px 22px",fontSize:13,fontWeight:600,cursor:busy?"not-allowed":"pointer",opacity:busy&&busy!==key?.5:1}}>
        {busy===key?"匯出中…":"下載 CSV"}
      </button>
    </div>
  );

  return (
    <div>
      <h2 style={{fontSize:18,fontWeight:700,marginBottom:16}}>匯出報表</h2>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {card("訂單報表", "每張訂單一列，含付款/可出貨/出貨狀態", "orders", exportOrders)}
        {card("訂單明細", "每筆商品一列，含採買狀態", "items", exportItems)}
        {card("配貨彙總採買清單", "依商品名稱＋規格加總，含相關訂單編號", "distribution", exportDistribution)}
      </div>
      {msg && <div style={{marginTop:16,fontSize:13,color:msg.includes("失敗")?C.red:C.green}}>{msg}</div>}
      <div style={{marginTop:16,fontSize:12,color:C.faint,lineHeight:1.7}}>CSV 已加上 BOM，用 Excel 開啟中文不會亂碼。</div>
    </div>
  );
}
