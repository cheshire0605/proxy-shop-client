import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { C } from "../../theme";
import { fmtMoney, isImgSrc } from "../../utils";
import { ORDER_LABEL, toCSV, downloadCSV } from "../adminUtils";
import { logAction } from "../auditLog";

export function ArchivePage(){
  const [tab, setTab] = useState("orders");        // orders | products
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");     // 訂單狀態篩選
  const [toast, setToast] = useState("");
  const flash = m => { setToast(m); setTimeout(()=>setToast(""), 2400); };

  const load = async () => {
    setLoading(true);
    const [o, p] = await Promise.all([
      supabase.from("orders").select("*, items:order_items(*)").eq("archived", true).order("updated_at",{ascending:false}),
      supabase.from("products").select("*, variants:product_variants(*)").eq("archived", true).order("updated_at",{ascending:false}),
    ]);
    setOrders(o.data || []); setProducts(p.data || []);
    setLoading(false);
  };
  useEffect(()=>{ load(); }, []);

  // ── 訂單 ──
  const unarchive = async (id) => {
    const { error } = await supabase.from("orders").update({ archived:false, updated_at:new Date().toISOString() }).eq("id", id);
    if (error) { flash("失敗："+error.message); return; }
    flash("已取消封存"); load();
  };
  const deleteOne = async (id) => {
    if (!window.confirm("確定永久刪除？此操作無法復原。")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) { flash("刪除失敗："+error.message); return; }
    logAction("刪除封存訂單", `#${orders.find(x=>x.id===id)?.no||""}`); flash("已刪除"); load();
  };
  const exportCSV = () => {
    downloadCSV("封存訂單.csv", toCSV(filteredOrders, [
      { label:"訂單編號", get:o=>"#"+(o.no||"") },
      { label:"日期", get:o=>o.created_at?new Date(o.created_at).toLocaleDateString("zh-TW"):"" },
      { label:"客人", get:o=>o.customer_name||"" },
      { label:"狀態", get:o=>ORDER_LABEL[o.status]||o.status },
      { label:"總金額", get:o=>Number(o.total)||0 },
    ]));
  };
  const deleteAllOrders = async () => {
    if (!filteredOrders.length) return;
    if (!window.confirm(`確定永久刪除這 ${filteredOrders.length} 筆封存訂單？此操作無法復原。`)) return;
    const { error } = await supabase.from("orders").delete().in("id", filteredOrders.map(o=>o.id));
    if (error) { flash("刪除失敗："+error.message); return; }
    logAction("批次刪除封存訂單", `${filteredOrders.length} 筆`); flash(`已刪除 ${filteredOrders.length} 筆`); load();
  };

  // ── 商品 ──
  const stockOf = (p) => (p.variants||[]).reduce((s,v)=>s+(Number(v.stock)||0),0);
  const unarchiveProduct = async (p) => {
    const { error } = await supabase.from("products").update({ archived:false, updated_at:new Date().toISOString() }).eq("id", p.id);
    if (error) { flash("失敗："+error.message); return; }
    logAction("還原商品", p.name||""); flash("已還原（回到賣場，維持下架狀態）"); load();
  };
  const deleteProduct = async (p) => {
    const st = stockOf(p);
    const msg = st>0
      ? `永久刪除「${p.name}」？\n尚有 ${st} 件在庫，刪除後這些在庫紀錄一併移除、無法復原。`
      : `永久刪除「${p.name}」（含所有規格）？此操作無法復原。`;
    if (!window.confirm(msg)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) { flash("刪除失敗：此商品可能已有訂單引用。\n"+error.message); return; }
    logAction("刪除商品", p.name||""); flash("已刪除"); load();
  };

  const filteredOrders = orders.filter(o => filter==="all" || o.status===filter);
  const statuses = ["all", ...Object.keys(ORDER_LABEL)];

  const tabBtn = (k,l,n) => (
    <button onClick={()=>setTab(k)} style={{ padding:"7px 16px", borderRadius:99, fontSize:13, fontWeight:tab===k?700:500, cursor:"pointer", border:"none", background:tab===k?C.accent:C.bgDeep, color:tab===k?"#fff":C.textMid }}>{l}（{n}）</button>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12, maxWidth:720 }}>
      <div style={{ fontWeight:700, fontSize:16, color:C.accentDark }}>📦 封存區</div>
      <div style={{ display:"flex", gap:8 }}>
        {tabBtn("orders","訂單",orders.length)}
        {tabBtn("products","商品",products.length)}
      </div>

      {loading ? <div style={{ color:C.muted, padding:20 }}>載入中…</div> : tab==="orders" ? (<>
        {/* 訂單分頁 */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
          {statuses.map(s=>{
            const count = s==="all" ? orders.length : orders.filter(o=>o.status===s).length;
            if (count===0 && s!=="all") return null;
            const on = filter===s;
            return <button key={s} onClick={()=>setFilter(s)} style={{ padding:"5px 12px", borderRadius:99, fontSize:12, fontWeight:600, cursor:"pointer", border:`1.5px solid ${on?C.accent:C.border}`, background:on?C.accentBg:"transparent", color:on?C.accentDark:C.muted }}>{s==="all"?"全部":ORDER_LABEL[s]}（{count}）</button>;
          })}
          {filteredOrders.length>0 && <>
            <button onClick={exportCSV} style={{ marginLeft:"auto", background:C.green, color:"#fff", border:"none", borderRadius:99, padding:"6px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>📊 匯出</button>
            <button onClick={deleteAllOrders} style={{ background:C.redBg, color:C.red, border:"none", borderRadius:99, padding:"6px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>🗑 全部刪除</button>
          </>}
        </div>
        {!filteredOrders.length ? <div style={{ textAlign:"center", padding:"40px 0", background:C.surface, borderRadius:C.r, color:C.muted }}><div style={{ fontSize:32, marginBottom:8 }}>📭</div>沒有封存訂單</div> :
         filteredOrders.map(o=>(
          <div key={o.id} style={{ background:C.surface, borderRadius:C.r, boxShadow:C.shadow, padding:16, opacity:.95 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:12, color:C.muted }}>#{o.no}</span>
                  <span style={{ fontSize:11, fontWeight:600, color:o.status==="cancelled"?C.red:C.muted, background:C.bgDeep, padding:"2px 8px", borderRadius:99 }}>{ORDER_LABEL[o.status]||o.status}</span>
                </div>
                <div style={{ fontWeight:600 }}>{o.customer_name||"匿名"}</div>
                <div style={{ marginTop:6, display:"flex", flexWrap:"wrap", gap:8 }}>
                  {(o.items||[]).map((it,idx)=>(
                    <div key={idx} style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <div style={{ width:24, height:24, borderRadius:5, background:C.bgDeep, flexShrink:0, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        {isImgSrc(it.image)?<img src={it.image} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>e.target.style.display="none"}/>:<span style={{ fontSize:7, color:C.faint }}>no img</span>}
                      </div>
                      <span style={{ fontSize:11, color:C.muted }}>{it.product_name}{it.spec?`/${it.spec}`:""} ×{it.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}><div style={{ fontWeight:700, color:C.accentDark }}>{fmtMoney(o.total)}</div></div>
            </div>
            <div style={{ display:"flex", gap:8, paddingTop:10, borderTop:`1px solid ${C.border}` }}>
              <button onClick={()=>unarchive(o.id)} style={{ fontSize:12, background:C.bgDeep, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 14px", cursor:"pointer", color:C.textMid }}>↩ 取消封存</button>
              <button onClick={()=>deleteOne(o.id)} style={{ fontSize:12, background:C.redBg, border:"none", borderRadius:8, padding:"6px 14px", cursor:"pointer", color:C.red, fontWeight:600 }}>🗑 刪除</button>
            </div>
          </div>
        ))}
      </>) : (<>
        {/* 商品分頁 */}
        {!products.length ? <div style={{ textAlign:"center", padding:"40px 0", background:C.surface, borderRadius:C.r, color:C.muted }}><div style={{ fontSize:32, marginBottom:8 }}>📦</div>沒有封存商品</div> :
         products.map(p=>{
          const st = stockOf(p);
          const isStock = p.type==="stock";
          return (
          <div key={p.id} style={{ background:C.surface, borderRadius:C.r, boxShadow:C.shadow, padding:16, opacity:.95 }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:10 }}>
              <div style={{ width:44, height:44, borderRadius:8, background:C.bgDeep, flexShrink:0, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {isImgSrc(p.image)?<img src={p.image} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>:<span style={{ fontSize:8, color:C.faint }}>no img</span>}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontWeight:600 }}>{p.name}</span>
                  <span style={{ fontSize:10, color:C.muted, background:C.bgDeep, padding:"2px 7px", borderRadius:99 }}>{isStock?"現貨":"代購"}</span>
                </div>
                <div style={{ marginTop:4, display:"flex", flexWrap:"wrap", gap:6 }}>
                  {(p.variants||[]).map(v=>(
                    <span key={v.id} style={{ fontSize:11, color:C.muted, background:C.bgDeep, borderRadius:6, padding:"2px 8px" }}>
                      {v.spec||"標準"}{v.stock!=null?` · 在庫 ${v.stock}`:""}
                    </span>
                  ))}
                </div>
              </div>
              {isStock && <div style={{ textAlign:"right", flexShrink:0 }}><div style={{ fontSize:11, color:C.muted }}>總在庫</div><div style={{ fontWeight:700, color:st>0?C.accentDark:C.faint }}>{st}</div></div>}
            </div>
            <div style={{ display:"flex", gap:8, paddingTop:10, borderTop:`1px solid ${C.border}` }}>
              <button onClick={()=>unarchiveProduct(p)} style={{ fontSize:12, background:C.bgDeep, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 14px", cursor:"pointer", color:C.textMid }}>↩ 還原</button>
              <button onClick={()=>deleteProduct(p)} style={{ fontSize:12, background:C.redBg, border:"none", borderRadius:8, padding:"6px 14px", cursor:"pointer", color:C.red, fontWeight:600 }}>🗑 永久刪除</button>
            </div>
          </div>
          );
        })}
      </>)}

      {toast && <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", background:C.text, color:"#fff", padding:"11px 22px", borderRadius:99, fontSize:13, zIndex:200, boxShadow:C.shadow }}>{toast}</div>}
    </div>
  );
}
