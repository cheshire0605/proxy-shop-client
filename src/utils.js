// ─── 共用小工具函式 ───────────────────────────────────────────────
export const secureUid = () => { const a=new Uint8Array(9); crypto.getRandomValues(a); return Array.from(a,b=>b.toString(36).padStart(2,"0")).join("").slice(0,12); };
export const sanitize = (s,max=200) => String(s??"").replace(/<[^>]*>/g,"").replace(/[<>"'`\\]/g,"").replace(/javascript:/gi,"").trim().slice(0,max);
export const safeQty = n => { const v=parseInt(n,10); return Number.isFinite(v)&&v>=1&&v<=99?v:1; };
export const safePrice = n => { const v=Number(n); return Number.isFinite(v)&&v>=0?Math.round(v*100)/100:0; };
export const secureOrderNo = () => { const a=new Uint32Array(1); crypto.getRandomValues(a); return String(100000+(a[0]%900000)); };
export const fmtMoney = n => `NT$ ${Number(n||0).toLocaleString()}`;
// 判斷是否為圖片來源（網址或 base64），否則當 emoji/文字顯示
export const isImgSrc = s => !!s && (s.startsWith("data:") || s.startsWith("http"));

// 解析品項名稱：拆出商品名稱和規格/款式
export const parseItemName = (name) => {
  if (!name) return { mainName: "", variants: [] };
  const parts = name.split(" / ");
  const mainName = parts[0] || "";
  const variants = parts.slice(1).map(p => {
    const idx = p.indexOf("：");
    if (idx > -1) return { label: p.slice(0, idx), value: p.slice(idx + 1) };
    return { label: "", value: p };
  });
  return { mainName, variants };
};

// 把 order_items（正規化）轉成畫面慣用的形狀（name 為「商品 / 規格」合併字串）
export const orderItemsToLegacy = (items) => (items || []).map(it => ({
  name: it.spec ? `${it.product_name} / ${it.spec}` : (it.product_name || ""),
  qty: it.qty,
  price: it.price,
  image: it.image || "",
  note: it.note || "",
  purchase_status: it.purchase_status,
}));

// 客人端要顯示的訂單狀態（審核/取消優先，其餘看出貨狀態）
export const custOrderState = (o) => {
  if (!o) return "pending";
  if (o.status === "cancelled") return "cancelled";
  if (o.status === "pending_review") return "pending_review";
  return o.shipping_status || "pending";
};
