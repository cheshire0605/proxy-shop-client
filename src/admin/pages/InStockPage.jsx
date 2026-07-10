import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { C } from "../../theme";
import { fmtMoney, isImgSrc } from "../../utils";
import { logAction } from "../auditLog";
import { Modal, inp, label } from "../ui";

// ─── 進貨彈窗（統一：現貨/代購共用；數量＋成本，台幣或日幣×匯率）──
function InboundModal({ target, rate, onClose, onDone }){
  const [qty, setQty] = useState("");
  const [mode, setMode] = useState("twd");
  const [twd, setTwd] = useState("");
  const [jpy, setJpy] = useState("");
  const [r, setR] = useState(rate || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const costFinal = mode==="jpy" ? Math.round((Number(jpy)||0)*(Number(r)||0)) : (Number(twd)||0);

  const submit = async () => {
    const q = Number(qty)||0; if (q<=0) { setErr("請填進貨數量"); return; }
    setBusy(true); setErr("");
    const { error } = await supabase.rpc("stock_inbound", { p_variant_id: target.id, p_qty: q, p_cost: costFinal });
    if (error) { setErr("進貨失敗：" + error.message); setBusy(false); return; }
    logAction("進貨", `${target.name}${target.spec?`/${target.spec}`:""} · ${q} 件 · 成本 ${costFinal}`);
    onDone(`已進貨 ${q} 件 ✅`);
  };

  return (
    <Modal onClose={onClose} maxWidth={420}>
      <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>進貨</div>
      <div style={{fontSize:13,color:C.muted,marginBottom:16}}>{target.name}{target.spec?` / ${target.spec}`:""}</div>
      <div style={{marginBottom:12}}><label style={label}>進貨數量</label><input type="number" value={qty} onChange={e=>setQty(e.target.value)} style={inp} placeholder="數量"/></div>
      <label style={label}>成本填寫方式</label>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        {[{v:"twd",t:"直接填台幣"},{v:"jpy",t:"日幣 × 匯率"}].map(o=>(
          <button key={o.v} onClick={()=>setMode(o.v)} style={{flex:1,border:`1.5px solid ${mode===o.v?C.accent:C.border}`,background:mode===o.v?C.accent:"#fff",color:mode===o.v?"#fff":C.textMid,borderRadius:8,padding:"8px",fontSize:13,cursor:"pointer"}}>{o.t}</button>
        ))}
      </div>
      {mode==="twd"
        ? <div style={{marginBottom:12}}><label style={label}>單件成本 NT$</label><input type="number" value={twd} onChange={e=>setTwd(e.target.value)} style={inp} placeholder="0"/></div>
        : <div style={{display:"flex",gap:8,marginBottom:12}}>
            <div style={{flex:1}}><label style={label}>日幣價格 ¥</label><input type="number" value={jpy} onChange={e=>setJpy(e.target.value)} style={inp} placeholder="0"/></div>
            <div style={{flex:1}}><label style={label}>匯率 ¥1＝NT$</label><input type="number" value={r} onChange={e=>setR(e.target.value)} style={inp}/></div>
          </div>}
      <div style={{fontSize:12,color:C.muted,marginBottom:14}}>單件成本：<b style={{color:C.accent}}>NT$ {costFinal}</b>（進貨後自動更新平均成本）</div>
      {err && <div style={{fontSize:12,color:C.red,background:C.redBg,padding:"8px 12px",borderRadius:8,marginBottom:10}}>{err}</div>}
      <button onClick={submit} disabled={busy} style={{width:"100%",background:C.accent,color:"#fff",border:"none",borderRadius:99,padding:"12px",fontSize:14,fontWeight:600,cursor:busy?"not-allowed":"pointer",opacity:busy?.6:1}}>確認進貨</button>
    </Modal>
  );
}

// 商品庫存：所有 SKU 統一一張清單（在手/已預約/可賣/平均成本），可進貨、看各批、盤點調整
export function InStockPage(){
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openKey, setOpenKey] = useState(null);   // 展開各批進貨
  const [inbound, setInbound] = useState(null);    // 進貨對象
  const [rate, setRate] = useState("");
  const [toast, setToast] = useState("");
  const flash = m => { setToast(m); setTimeout(()=>setToast(""), 1800); };

  const load = async () => {
    setLoading(true);
    const [prodRes, costRes, lotRes, setRes] = await Promise.all([
      supabase.from("products").select("id,name,image,type,status,variants:product_variants(id,spec,stock,reserved)").eq("archived",false).order("created_at",{ascending:false}),
      supabase.from("variant_costs").select("variant_id,cost"),
      supabase.from("purchase_lots").select("variant_id,qty,cost,created_at").not("variant_id","is",null).gt("qty",0),
      supabase.from("settings").select("value").eq("key","jpy_rate").maybeSingle(),
    ]);
    const costBy = {}; (costRes.data||[]).forEach(c=>{ costBy[c.variant_id]=Number(c.cost)||0; });
    const lotsBy = {}; (lotRes.data||[]).forEach(l=>{ (lotsBy[l.variant_id] ||= []).push(l); });
    const list = [];
    (prodRes.data||[]).forEach(p=>(p.variants||[]).forEach(v=>{
      const lots = (lotsBy[v.id]||[]).sort((a,b)=>(b.created_at||"").localeCompare(a.created_at||""));
      list.push({
        id:v.id, pid:p.id, pstatus:p.status, name:p.name, image:p.image, spec:v.spec, type:p.type,
        stock:Number(v.stock)||0, orig:Number(v.stock)||0, reserved:Number(v.reserved)||0,
        cost:costBy[v.id], lots,
      });
    }));
    setRows(list);
    if (setRes.data?.value) setRate(String(setRes.data.value));
    setLoading(false);
  };
  useEffect(()=>{ load(); }, []);

  // 盤點調整：直接改在手量（reason=adjust，無成本）
  const setLocal = (id, stock) => setRows(rs=>rs.map(r=>r.id===id?{...r,stock}:r));
  const commit = async (row, val) => {
    const newStock = Math.max(0, Number(val)||0);
    const delta = newStock - row.orig;
    if (delta===0) return;
    const avail = newStock - (row.reserved||0);
    const { error } = await supabase.from("product_variants").update({ stock:newStock, status:(row.type==="stock"&&avail<=0)?"sold_out":"on", updated_at:new Date().toISOString() }).eq("id", row.id);
    if (error) { flash("更新失敗"); return; }
    await supabase.from("stock_movements").insert([{ variant_id:row.id, delta, reason:"adjust" }]);
    logAction("盤點調整", `${row.name}${row.spec?`/${row.spec}`:""} · ${delta>0?"+":""}${delta}`);
    flash("已盤點調整"); load();
  };
  const step = (row, d) => commit(row, row.stock + d);

  // 一鍵上架/下架（作用於整個商品；同商品的規格共用上架狀態）
  const toggleList = async (row) => {
    const next = row.pstatus==="on" ? "off" : "on";
    const { error } = await supabase.from("products").update({ status:next, updated_at:new Date().toISOString() }).eq("id", row.pid);
    if (error) { flash("更新失敗"); return; }
    logAction(next==="on"?"上架商品":"下架商品", row.name);
    flash(next==="on"?"已上架，客人看得到了":"已下架"); load();
  };

  const s = search.trim();
  const filtered = rows.filter(r => !s || r.name.includes(s) || (r.spec||"").includes(s));
  const stockN = rows.filter(r=>r.type==="stock").length;
  const proxyN = rows.filter(r=>r.type!=="stock").length;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12, maxWidth:720 }}>
      <div style={{ fontWeight:700, fontSize:16, color:C.accentDark }}>📦 商品庫存　<span style={{fontSize:12,fontWeight:400,color:C.muted}}>現貨 {stockN} · 代購 {proxyN}</span></div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜尋 商品 / 規格…"
        style={{ width:"100%", background:C.bg, border:`1.5px solid ${C.border}`, borderRadius:10, padding:"9px 14px", color:C.text, fontSize:14, boxSizing:"border-box" }}/>

      {loading ? <div style={{ color:C.muted, padding:20 }}>載入中…</div> :
       !filtered.length ? <div style={{ textAlign:"center", padding:"40px 0", background:C.surface, borderRadius:C.r, color:C.muted }}><div style={{ fontSize:40, marginBottom:8 }}>📦</div>還沒有商品</div> :
       filtered.map(row => {
        const isStock = row.type==="stock";
        const avail = row.stock - (row.reserved||0);
        const out = isStock && avail<=0, low = isStock && avail>0 && avail<=3, owe = avail<0;
        const open = openKey===row.id;
        return (
        <div key={row.id} style={{ background:C.surface, borderRadius:C.r, boxShadow:C.shadow, overflow:"hidden", opacity:out?.75:1 }}>
          <div style={{ padding:"12px 16px", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:8, background:C.bgDeep, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", flexShrink:0 }}>
              {isImgSrc(row.image)?<img src={row.image} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>:<span style={{ fontSize:8, color:C.faint }}>no img</span>}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:600 }}>{row.name}{row.spec?` / ${row.spec}`:""}
                <span style={{fontSize:10,color:isStock?C.green:C.accent,background:isStock?C.greenBg:C.accentBg,borderRadius:99,padding:"1px 7px",marginLeft:4}}>{isStock?"現貨":"代購"}</span>
                {row.pstatus!=="on" && <span style={{fontSize:10,color:C.amber,background:C.amberBg,borderRadius:99,padding:"1px 7px",marginLeft:4}}>未上架</span>}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                在手 <b>{row.stock}</b> · 已預約 {row.reserved||0} · 可賣 <b style={{color:owe?C.red:(out?C.red:C.accent)}}>{avail}</b>
                {row.cost!=null?` · 平均成本 ${fmtMoney(row.cost)}`:""}
                {out&&<span style={{marginLeft:6,color:C.red}}>售完</span>}
                {low&&<span style={{marginLeft:6,color:C.amber}}>低庫存</span>}
                {owe&&<span style={{marginLeft:6,color:C.red}}>待補 {-avail}</span>}
              </div>
            </div>
            <button onClick={()=>setInbound(row)} style={{ flexShrink:0, background:C.accent, color:"#fff", border:"none", borderRadius:8, padding:"7px 12px", fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>＋進貨</button>
          </div>
          {/* 盤點調整 + 展開各批 */}
          <div style={{ borderTop:`1px solid ${C.borderLight}`, padding:"8px 16px", display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:11, color:C.muted }}>盤點</span>
            <button onClick={()=>step(row,-1)} style={{ width:26, height:26, borderRadius:6, border:`1px solid ${C.border}`, background:"#fff", cursor:"pointer", fontSize:14, color:C.muted }}>−</button>
            <input type="number" value={row.stock} onChange={e=>setLocal(row.id, Math.max(0,Number(e.target.value)||0))} onBlur={e=>commit(row, e.target.value)}
              style={{ width:52, textAlign:"center", padding:"4px", border:`1.5px solid ${C.border}`, borderRadius:6, fontSize:14, fontWeight:700, color:C.accentDark, background:"#fff" }}/>
            <button onClick={()=>step(row,1)} style={{ width:26, height:26, borderRadius:6, border:`1px solid ${C.border}`, background:"#fff", cursor:"pointer", fontSize:14, color:C.accent }}>+</button>
            <button onClick={()=>toggleList(row)} style={{ marginLeft:8, border:`1px solid ${row.pstatus==="on"?C.border:C.accent}`, background:row.pstatus==="on"?"#fff":C.accentBg, color:row.pstatus==="on"?C.muted:C.accent, borderRadius:8, padding:"5px 12px", fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>{row.pstatus==="on"?"下架":"上架"}</button>
            {row.lots.length>0 && <button onClick={()=>setOpenKey(open?null:row.id)} style={{ marginLeft:"auto", border:"none", background:"none", color:C.accent, fontSize:12, cursor:"pointer" }}>各批進貨（{row.lots.length}）{open?"▲":"▼"}</button>}
          </div>
          {open && (
            <div style={{ borderTop:`1px solid ${C.borderLight}`, background:C.bgDeep, padding:"8px 16px" }}>
              {row.lots.map((l,i)=>(
                <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.textMid, padding:"3px 0" }}>
                  <span>{l.created_at?new Date(l.created_at).toLocaleDateString("zh-TW"):"—"} · {l.qty} 件</span>
                  <span>單價 {fmtMoney(l.cost)} · 小計 {fmtMoney(l.cost*l.qty)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        );
       })
      }
      {inbound && <InboundModal target={inbound} rate={rate} onClose={()=>setInbound(null)} onDone={(m)=>{ setInbound(null); flash(m); load(); }}/>}
      {toast && <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", background:C.text, color:"#fff", padding:"11px 22px", borderRadius:99, fontSize:13, zIndex:200, boxShadow:C.shadow }}>{toast}</div>}
    </div>
  );
}
