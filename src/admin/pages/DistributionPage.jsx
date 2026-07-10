import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { C } from "../../theme";
import { logAction } from "../auditLog";
import { inp, label, Modal } from "../ui";

// ─── 配貨採買（統一模型）：一個代購 SKU 一張卡；進貨(+在手) + 逐單配貨(earmark) ───
function AllocationModal({ target, onClose, onDone }){
  const [rows, setRows] = useState([]);            // {id,no,customer,qty,allocated,_orig}
  const [stock, setStock] = useState(0);
  const [lotQty, setLotQty] = useState("");
  const [costMode, setCostMode] = useState("twd");
  const [lotCost, setLotCost] = useState("");
  const [lotJpy, setLotJpy] = useState("");
  const [rate, setRate] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const reload = async () => {
    const [{ data: items }, { data: pv }] = await Promise.all([
      supabase.from("order_items").select("id, qty, allocated_qty, orders(no, customer_name, status, shipping_status)").eq("variant_id", target.variant_id),
      supabase.from("product_variants").select("stock").eq("id", target.variant_id).maybeSingle(),
    ]);
    const list = (items || []).filter(it => it.orders && it.orders.status !== "cancelled" && !["shipped","arrived","completed"].includes(it.orders.shipping_status))
      .map(it => ({ id: it.id, no: it.orders.no, customer: it.orders.customer_name, qty: it.qty, allocated: it.allocated_qty || 0, _orig: it.allocated_qty || 0 }));
    list.sort((a,b)=>String(a.no||"").localeCompare(String(b.no||"")));   // 先來後到（單號）
    setRows(list);
    setStock(Number(pv?.stock)||0);
    setLoading(false);
  };
  useEffect(()=>{ setLoading(true); reload(); }, [target]);
  useEffect(()=>{ supabase.from("settings").select("value").eq("key","jpy_rate").maybeSingle().then(({data})=>{ if(data?.value) setRate(String(data.value)); }); }, []);

  const totalOrdered = rows.reduce((s,r)=>s+r.qty,0);
  const allocatedTotal = rows.reduce((s,r)=>s+(Number(r.allocated)||0),0);
  const pool = stock - allocatedTotal;                    // 待分配池（在手−已配）
  const shortage = Math.max(0, totalOrdered - stock);     // 還缺（要再買）
  const over = allocatedTotal > stock;
  const lotCostFinal = costMode==="jpy" ? Math.round((Number(lotJpy)||0)*(Number(rate)||0)) : (Number(lotCost)||0);

  const setAlloc = (id,v) => setRows(rs => rs.map(r => r.id===id ? { ...r, allocated: v } : r));
  const clampAlloc = (id,v,qty) => setAlloc(id, Math.max(0, Math.min(Number(v)||0, qty)));
  const autoAllocate = () => { let left = stock; setRows(rs => rs.map(r => { const give = Math.min(r.qty, Math.max(0,left)); left -= give; return { ...r, allocated: give }; })); };

  // 只進貨：加在手＋記批次成本（stock_inbound）
  const inbound = async () => {
    const q = Number(lotQty)||0; if (q<=0) { setErr("請填進貨數量"); return; }
    setBusy(true); setErr("");
    const { error } = await supabase.rpc("stock_inbound", { p_variant_id: target.variant_id, p_qty: q, p_cost: lotCostFinal });
    if (error) { setErr("進貨失敗：" + error.message); setBusy(false); return; }
    logAction("進貨", `${target.product_name}${target.spec?`/${target.spec}`:""} · ${q} 件`);
    setLotQty(""); setLotCost(""); setLotJpy(""); await reload(); setBusy(false);
  };

  // 進貨並配貨：進貨後依單號先來後到(FIFO)把新在手自動配滿各訂單
  const quickInbound = async () => {
    const q = Number(lotQty)||0; if (q<=0) { setErr("請填『這次買到』的數量"); return; }
    setBusy(true); setErr("");
    try {
      const { error:e1 } = await supabase.rpc("stock_inbound", { p_variant_id: target.variant_id, p_qty: q, p_cost: lotCostFinal });
      if (e1) throw e1;
      let left = stock + q;
      const targets = [...rows].sort((a,b)=>String(a.no||"").localeCompare(String(b.no||"")))
        .map(r=>{ const give = Math.min(r.qty, Math.max(0,left)); left -= give; return { id:r.id, give, orig:Number(r._orig)||0 }; });
      targets.sort((a,b)=>(a.give-a.orig)-(b.give-b.orig));   // 先減後加，避免中途超池
      for (const t of targets) {
        if (t.give !== t.orig) { const { error } = await supabase.rpc("allocate_order_item", { p_item_id:t.id, p_qty:t.give }); if (error) throw error; }
      }
      logAction("進貨並配貨", `${target.product_name}${target.spec?`/${target.spec}`:""} · ${q} 件`);
      onDone(`已進貨 ${q} 件並自動配貨 ✅`);
    } catch(e){ setErr("進貨失敗：" + (e.message||e)); setBusy(false); }
  };

  const saveAlloc = async () => {
    if (over) { setErr(`配貨總量 ${allocatedTotal} 超過在手 ${stock}，請先進貨或減少配貨`); return; }
    setBusy(true); setErr("");
    try {
      const ordered = [...rows].sort((a,b)=>((a.allocated-a._orig)-(b.allocated-b._orig)));   // 先減後加
      for (const r of ordered) {
        const { error } = await supabase.rpc("allocate_order_item", { p_item_id: r.id, p_qty: Math.max(0, Math.min(Number(r.allocated)||0, r.qty)) });
        if (error) throw error;
      }
      logAction("儲存配貨", `${target.product_name}${target.spec?`/${target.spec}`:""}`);
      onDone("已儲存配貨 ✅");
    } catch(e){ setErr("儲存失敗：" + (e.message||e)); setBusy(false); }
  };

  const statRow = (l,v,color) => <div style={{display:"flex",justifyContent:"space-between"}}><span>{l}</span><b style={color?{color}:undefined}>{v}</b></div>;

  return (
    <Modal onClose={onClose} maxWidth={460}>
      <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>配貨採買</div>
      <div style={{fontSize:13,color:C.muted,marginBottom:16}}>{target.product_name}{target.spec?` / ${target.spec}`:""}</div>
      {loading ? <div style={{color:C.muted,padding:20}}>載入中…</div> : (<>
        {/* 統計 */}
        <div style={{background:C.bgDeep,borderRadius:8,padding:"10px 14px",fontSize:13,lineHeight:1.9,marginBottom:14}}>
          {statRow("已訂購", totalOrdered)}
          {statRow("在手（已進貨）", stock)}
          {statRow("已配", `${allocatedTotal} / ${totalOrdered}`, allocatedTotal>=totalOrdered&&totalOrdered>0?C.green:C.amber)}
          {shortage>0 && statRow("還缺（要再買）", shortage, C.red)}
          <div style={{borderTop:`1px solid ${C.border}`,marginTop:4,paddingTop:4}}>{statRow("待分配池", Math.max(0,pool), C.accent)}</div>
        </div>

        {/* 進貨 */}
        <div style={{border:`1.5px dashed ${C.border}`,borderRadius:10,padding:"12px 14px",marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>＋ 進貨</div>
          <div style={{marginBottom:10}}><label style={label}>這次買到</label><input type="number" value={lotQty} onChange={e=>setLotQty(e.target.value)} style={inp} placeholder="數量"/></div>
          <label style={label}>成本填寫方式</label>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            {[{v:"twd",t:"直接填台幣"},{v:"jpy",t:"日幣 × 匯率"}].map(o=>(
              <button key={o.v} onClick={()=>setCostMode(o.v)} style={{flex:1,border:`1.5px solid ${costMode===o.v?C.accent:C.border}`,background:costMode===o.v?C.accent:"#fff",color:costMode===o.v?"#fff":C.textMid,borderRadius:8,padding:"8px",fontSize:13,cursor:"pointer"}}>{o.t}</button>
            ))}
          </div>
          {costMode==="twd"
            ? <div style={{marginBottom:10}}><label style={label}>單件成本 NT$</label><input type="number" value={lotCost} onChange={e=>setLotCost(e.target.value)} style={inp} placeholder="0"/></div>
            : <div style={{display:"flex",gap:8,marginBottom:10}}>
                <div style={{flex:1}}><label style={label}>日幣價格 ¥</label><input type="number" value={lotJpy} onChange={e=>setLotJpy(e.target.value)} style={inp} placeholder="0"/></div>
                <div style={{flex:1}}><label style={label}>匯率 ¥1＝NT$</label><input type="number" value={rate} onChange={e=>setRate(e.target.value)} style={inp}/></div>
              </div>}
          <div style={{fontSize:12,color:C.muted,marginBottom:8}}>單件成本：<b style={{color:C.accent}}>NT$ {lotCostFinal}</b></div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={inbound} disabled={busy} style={{flex:1,background:"#fff",color:C.accent,border:`1.5px solid ${C.accent}`,borderRadius:8,padding:"9px",fontSize:13,fontWeight:600,cursor:busy?"not-allowed":"pointer",whiteSpace:"nowrap"}}>只進貨</button>
            <button onClick={quickInbound} disabled={busy} style={{flex:2,background:C.accent,color:"#fff",border:"none",borderRadius:8,padding:"9px",fontSize:13,fontWeight:600,cursor:busy?"not-allowed":"pointer",whiteSpace:"nowrap"}}>進貨並配貨（FIFO）</button>
          </div>
          <div style={{fontSize:11,color:C.faint,marginTop:6}}>「進貨並配貨」＝加在手＋依訂單先來後到自動配滿，不夠的留在配貨清單。</div>
        </div>

        {/* 逐單配貨 */}
        <div style={{display:"flex",alignItems:"center",marginBottom:8}}>
          <div style={{fontSize:12,color:C.muted,fontWeight:600}}>分配到訂單（填配給該單的數量）</div>
          <button onClick={autoAllocate} style={{marginLeft:"auto",border:`1.5px solid ${C.accent}`,background:C.accentBg,color:C.accent,borderRadius:8,padding:"5px 12px",fontSize:12,cursor:"pointer"}}>自動分配</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12,maxHeight:220,overflowY:"auto"}}>
          {rows.length===0 ? <div style={{color:C.faint,fontSize:13,padding:12}}>目前沒有待出貨訂單</div> :
           rows.map(r=>{
            const full = Number(r.allocated)>=r.qty;
            return (
            <div key={r.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",border:`1.5px solid ${full?C.accent:C.border}`,borderRadius:10,background:full?C.accentBg:"#fff"}}>
              <div style={{flex:1,fontSize:13,minWidth:0}}><b>#{r.no}</b> · {r.customer} <span style={{color:C.faint}}>訂 {r.qty}</span></div>
              <input type="number" value={r.allocated} onChange={e=>clampAlloc(r.id,e.target.value,r.qty)} style={{...inp,width:64,padding:"6px 8px",textAlign:"center"}}/>
              <span style={{fontSize:12,color:C.muted}}>/ {r.qty}</span>
            </div>
            );
          })}
        </div>

        {over && <div style={{fontSize:12,color:C.red,marginBottom:10}}>配貨總量已超過在手，請先進貨或減少配貨數量</div>}
        {err && <div style={{fontSize:12,color:C.red,background:C.redBg,padding:"8px 12px",borderRadius:8,marginBottom:10}}>{err}</div>}

        <button onClick={saveAlloc} disabled={busy} style={{width:"100%",background:C.accent,color:"#fff",border:"none",borderRadius:99,padding:"12px",fontSize:14,fontWeight:600,cursor:busy?"not-allowed":"pointer",opacity:busy?.6:1}}>儲存配貨</button>
      </>)}
    </Modal>
  );
}

export function DistributionPage(){
  const [summary, setSummary] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(new Set());
  const [alloc, setAlloc] = useState(null);
  const [toast, setToast] = useState("");
  const flash = m => { setToast(m); setTimeout(()=>setToast(""), 2800); };
  const toggleExpand = key => setExpanded(s => { const n=new Set(s); n.has(key)?n.delete(key):n.add(key); return n; });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("distribution_summary").select("*");
    setSummary(data || []);
    setLoading(false);
  };
  useEffect(()=>{ load(); }, []);

  const filtered = summary.filter(s => !search.trim() || (s.product_name||"").includes(search) || (s.spec||"").includes(search));

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12,flexWrap:"wrap"}}>
        <h2 style={{fontSize:18,fontWeight:700,margin:0}}>配貨採買</h2>
        <div style={{marginLeft:"auto"}}/>
        <button onClick={load} style={{border:`1px solid ${C.border}`,background:C.surface,borderRadius:99,padding:"6px 14px",fontSize:12,cursor:"pointer",color:C.textMid}}>重新整理</button>
      </div>
      <div style={{fontSize:12,color:C.muted,marginBottom:12,lineHeight:1.6}}>代購訂單的待補貨清單：每個商品訂了多少、進貨多少、還缺多少，並把買到的貨配給訂單。</div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜尋 商品 / 規格"
        style={{width:"100%",boxSizing:"border-box",padding:"10px 14px",border:`1.5px solid ${C.border}`,borderRadius:10,fontSize:14,marginBottom:14}}/>

      {loading ? <div style={{color:C.muted,padding:20}}>載入中…</div> :
       !filtered.length ? <div style={{textAlign:"center",padding:"40px 0",background:C.surface,borderRadius:C.r,color:C.muted}}><div style={{fontSize:40,marginBottom:8}}>🛒</div>目前沒有待處理的代購訂單</div> :
       <div style={{display:"flex",flexDirection:"column",gap:12,maxWidth:720}}>
        {filtered.map(s=>{
          const nos = Array.isArray(s.order_nos)?s.order_nos:(s.order_nos?[s.order_nos]:[]);
          const open = expanded.has(s.variant_id);
          const shown = open?nos:nos.slice(0,6);
          const done = (s.allocated_qty||0) >= (s.total_qty||0);
          return (
          <div key={s.variant_id} style={{background:C.surface,borderRadius:C.r,boxShadow:C.shadow,padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:600}}>{s.product_name}{s.spec?` / ${s.spec}`:""}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"2px 14px",fontSize:12,color:C.muted,marginTop:6}}>
                  <span>訂購 <b style={{color:C.text}}>{s.total_qty}</b></span>
                  <span>在手 <b style={{color:C.text}}>{s.on_hand_qty}</b></span>
                  <span>已配 <b style={{color:done?C.green:C.amber}}>{s.allocated_qty}</b></span>
                  {s.shortage_qty>0 && <span style={{color:C.red}}>還缺 <b>{s.shortage_qty}</b></span>}
                </div>
              </div>
              <button onClick={()=>setAlloc({variant_id:s.variant_id,product_name:s.product_name,spec:s.spec||""})} style={{flexShrink:0,background:C.accentBg,color:C.accent,border:"none",borderRadius:8,padding:"8px 14px",fontSize:13,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>配貨採買</button>
            </div>
            {nos.length>0 && (
              <div style={{display:"flex",flexWrap:"wrap",gap:4,alignItems:"center",marginTop:10,paddingTop:10,borderTop:`1px solid ${C.borderLight}`}}>
                {shown.map((no,i)=><span key={i} style={{fontSize:11,background:C.bgDeep,color:C.textMid,borderRadius:6,padding:"2px 7px"}}>#{no}</span>)}
                {nos.length>6 && <button onClick={()=>toggleExpand(s.variant_id)} style={{fontSize:11,border:"none",background:"none",color:C.accent,cursor:"pointer",fontWeight:600}}>{open?"收合":`＋${nos.length-6} 更多`}</button>}
              </div>
            )}
          </div>
          );
        })}
       </div>
      }

      {alloc && <AllocationModal target={alloc} onClose={()=>setAlloc(null)} onDone={(m)=>{ setAlloc(null); flash(m); load(); }}/>}
      {toast && <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:C.text,color:"#fff",padding:"11px 22px",borderRadius:99,fontSize:13,zIndex:200,boxShadow:C.shadow}}>{toast}</div>}
    </div>
  );
}
