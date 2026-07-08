import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { C } from "../../theme";
import { fmtMoney, isImgSrc } from "../../utils";
import { logAction } from "../auditLog";

export function InStockPage(){
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const flash = m => { setToast(m); setTimeout(()=>setToast(""), 1800); };

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*, variants:product_variants(*)").eq("type","stock").eq("archived",false).order("created_at",{ascending:false});
    const list = [];
    (data||[]).forEach(p=>(p.variants||[]).forEach(v=>{
      if (v.stock==null) return;                       // 只列有庫存管理的 SKU
      const s = Number(v.stock)||0;
      list.push({ id:v.id, product:p.name, image:p.image, spec:v.spec, price:v.price, stock:s, orig:s, reserved:Number(v.reserved)||0 });
    }));
    list.sort((a,b)=>a.stock-b.stock);                 // 庫存少的排前面
    setRows(list); setLoading(false);
  };
  useEffect(()=>{ load(); }, []);

  const setLocal = (id, stock) => setRows(rs=>rs.map(r=>r.id===id?{...r,stock}:r));
  const commit = async (row, val) => {
    const newStock = Math.max(0, Number(val)||0);
    const delta = newStock - row.orig;                 // 相對載入時 DB 值
    const avail = newStock - (row.reserved||0);        // 可賣＝在手−已預約
    const { error } = await supabase.from("product_variants").update({ stock:newStock, status:avail<=0?"sold_out":"on", updated_at:new Date().toISOString() }).eq("id", row.id);
    if (error) { flash("更新失敗"); return; }
    if (delta!==0) { await supabase.from("stock_movements").insert([{ variant_id:row.id, delta, reason:"adjust" }]); logAction("調整現貨庫存", `${row.product}${row.spec?`/${row.spec}`:""} · ${delta>0?"+":""}${delta}`); }
    flash("庫存已更新"); load();
  };
  const step = (row, d) => commit(row, row.stock + d);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12, maxWidth:680 }}>
      <div style={{ fontWeight:700, fontSize:16, color:C.accentDark }}>🏪 現貨 / 庫存（{rows.length} 項）</div>

      {loading ? <div style={{ color:C.muted, padding:20 }}>載入中…</div> :
       !rows.length ? <div style={{ textAlign:"center", padding:"40px 0", background:C.surface, borderRadius:C.r, color:C.muted }}><div style={{ fontSize:40, marginBottom:8 }}>📦</div>還沒有現貨庫存（可在「配貨採買」轉現貨，或「賣場」設現貨商品）</div> :
       rows.map(row=>{
        const avail = row.stock - (row.reserved||0);       // 可賣
        const out = avail<=0, low = avail>0 && avail<=3;
        return (
        <div key={row.id} style={{ background:C.surface, borderRadius:C.r, boxShadow:C.shadow, padding:"12px 16px", display:"flex", alignItems:"center", gap:12, opacity:out?.7:1 }}>
          <div style={{ width:40, height:40, borderRadius:8, background:C.bgDeep, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", flexShrink:0 }}>
            {isImgSrc(row.image)?<img src={row.image} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>:<span style={{ fontSize:8, color:C.faint }}>no img</span>}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:600 }}>{row.product}{row.spec?` / ${row.spec}`:""}</div>
            <div style={{ fontSize:12, color:C.green, fontWeight:600 }}>{fmtMoney(row.price)}
              {out && <span style={{ marginLeft:8, color:C.red }}>售完</span>}
              {low && <span style={{ marginLeft:8, color:C.amber }}>低庫存</span>}
            </div>
            <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>已預約 {row.reserved||0} · 可賣 <b style={{color:out?C.red:C.accent}}>{Math.max(0,avail)}</b></div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
            <button onClick={()=>step(row,-1)} style={{ width:28, height:28, borderRadius:6, border:`1px solid ${C.border}`, background:"#fff", cursor:"pointer", fontSize:14, color:C.muted }}>−</button>
            <input type="number" value={row.stock} onChange={e=>setLocal(row.id, Math.max(0,Number(e.target.value)||0))} onBlur={e=>commit(row, e.target.value)}
              style={{ width:56, textAlign:"center", padding:"5px 4px", border:`1.5px solid ${C.accent}40`, borderRadius:6, fontSize:15, fontWeight:700, color:C.accentDark, background:"#fff" }}/>
            <button onClick={()=>step(row,1)} style={{ width:28, height:28, borderRadius:6, border:`1px solid ${C.border}`, background:"#fff", cursor:"pointer", fontSize:14, color:C.accent }}>+</button>
            <span style={{ fontSize:11, color:C.muted, marginLeft:4 }}>件</span>
          </div>
        </div>
        );
      })}

      {toast && <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", background:C.text, color:"#fff", padding:"11px 22px", borderRadius:99, fontSize:13, zIndex:200, boxShadow:C.shadow }}>{toast}</div>}
    </div>
  );
}
