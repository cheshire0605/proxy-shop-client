import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { C } from "../../theme";
import { fmtMoney } from "../../utils";
import { PURCHASE_LABEL } from "../adminUtils";
import { th, td, inp, label, Modal } from "../ui";

// ─── 採買配貨 v2：分批採買 + 持續配貨(allocated_qty) + 待分配池隨時轉現貨 ───
function AllocationModal({ target, onClose, onDone }){
  const [rows, setRows] = useState([]);            // {id, no, customer, qty, allocated, _orig}
  const [purchasedTotal, setPurchasedTotal] = useState(0);
  const [lotQty, setLotQty] = useState("");
  const [lotCost, setLotCost] = useState("");
  const [costMode, setCostMode] = useState("twd");   // twd 直接台幣 / jpy 日幣×匯率
  const [lotJpy, setLotJpy] = useState("");
  const [rate, setRate] = useState("");
  const [convQty, setConvQty] = useState("");
  const [convPrice, setConvPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const reload = async () => {
    const [{ data: items }, { data: lots }] = await Promise.all([
      supabase.from("order_items").select("id, qty, allocated_qty, orders(no, customer_name, status), variant:product_variants(stock)").eq("product_name", target.product_name).eq("spec", target.spec || ""),
      supabase.from("purchase_lots").select("qty").eq("product_name", target.product_name).eq("spec", target.spec || ""),
    ]);
    const list = (items || []).filter(it => it.orders && it.orders.status !== "cancelled" && (!it.variant_id || it.variant?.stock == null))
      .map(it => ({ id: it.id, no: it.orders.no, customer: it.orders.customer_name, qty: it.qty, allocated: it.allocated_qty || 0, _orig: it.allocated_qty || 0 }));
    list.sort((a,b)=>String(a.no||"").localeCompare(String(b.no||"")));   // 先來後到（單號）
    setRows(list);
    setPurchasedTotal((lots || []).reduce((s,l)=>s+(l.qty||0),0));
    setLoading(false);
  };
  useEffect(()=>{ setLoading(true); reload(); }, [target]);
  useEffect(()=>{ supabase.from("settings").select("value").eq("key","jpy_rate").maybeSingle().then(({data})=>{ if(data?.value) setRate(String(data.value)); }); }, []);

  const totalOrdered = rows.reduce((s,r)=>s+r.qty,0);
  const allocatedTotal = rows.reduce((s,r)=>s+(Number(r.allocated)||0),0);
  const pool = purchasedTotal - allocatedTotal;            // 待分配池
  const over = allocatedTotal > purchasedTotal;
  const lotCostFinal = costMode==="jpy" ? Math.round((Number(lotJpy)||0)*(Number(rate)||0)) : (Number(lotCost)||0);

  const setAlloc = (id,v) => setRows(rs => rs.map(r => r.id===id ? { ...r, allocated: v } : r));
  const clampAlloc = (id,v,qty) => setAlloc(id, Math.max(0, Math.min(Number(v)||0, qty)));
  // 自動分配：從已採買量依序配滿各訂單
  const autoAllocate = () => { let left = purchasedTotal; setRows(rs => rs.map(r => { const give = Math.min(r.qty, Math.max(0,left)); left -= give; return { ...r, allocated: give }; })); };

  const addLot = async () => {
    const q = Number(lotQty)||0; if (q<=0) { setErr("請填採買數量"); return; }
    setBusy(true); setErr("");
    const { error } = await supabase.rpc("add_purchase_lot", { p_name: target.product_name, p_spec: target.spec||"", p_qty: q, p_cost: lotCostFinal });
    if (error) { setErr("新增採買失敗：" + error.message); setBusy(false); return; }
    setLotQty(""); setLotCost(""); setLotJpy(""); await reload(); setBusy(false);
  };

  // 一鍵入庫：記這批採買 → 依單號先來後到(FIFO)把新總量自動配滿各訂單
  const quickInbound = async () => {
    const q = Number(lotQty)||0; if (q<=0) { setErr("請填『這次買到』的數量"); return; }
    setBusy(true); setErr("");
    try {
      const { error:e1 } = await supabase.rpc("add_purchase_lot", { p_name: target.product_name, p_spec: target.spec||"", p_qty: q, p_cost: lotCostFinal });
      if (e1) throw e1;
      let left = purchasedTotal + q;
      const targets = [...rows].sort((a,b)=>String(a.no||"").localeCompare(String(b.no||"")))
        .map(r=>{ const give = Math.min(r.qty, Math.max(0,left)); left -= give; return { id:r.id, give, orig:Number(r._orig)||0 }; });
      targets.sort((a,b)=>(a.give-a.orig)-(b.give-b.orig));   // 先減後加，避免中途超池
      for (const t of targets) {
        if (t.give !== t.orig) { const { error } = await supabase.rpc("allocate_order_item", { p_item_id:t.id, p_qty:t.give }); if (error) throw error; }
      }
      onDone(`已入庫 ${q} 件並自動配貨 ✅`);
    } catch(e){ setErr("入庫失敗：" + (e.message||e)); setBusy(false); }
  };

  const saveAlloc = async () => {
    if (over) { setErr(`配貨總量 ${allocatedTotal} 超過已採買 ${purchasedTotal}，請先新增採買或減少配貨`); return; }
    setBusy(true); setErr("");
    try {
      // 先處理「減少」的品項再處理「增加」的，避免中途暫時超過池
      const ordered = [...rows].sort((a,b)=>((a.allocated-a._orig)-(b.allocated-b._orig)));
      for (const r of ordered) {
        const { error } = await supabase.rpc("allocate_order_item", { p_item_id: r.id, p_qty: Math.max(0, Math.min(Number(r.allocated)||0, r.qty)) });
        if (error) throw error;
      }
      onDone("已儲存配貨 ✅");
    } catch(e){ setErr("儲存失敗：" + (e.message||e)); setBusy(false); }
  };

  const convert = async () => {
    const q = Number(convQty)||0;
    if (q<=0) { setErr("請填轉現貨數量"); return; }
    if (q>pool) { setErr(`轉現貨數量超過待分配池（剩 ${pool}）`); return; }
    setBusy(true); setErr("");
    const { error } = await supabase.rpc("convert_pool_to_stock", { p_name: target.product_name, p_spec: target.spec||"", p_qty: q, p_price: Number(convPrice)||0, p_image: "" });
    if (error) { setErr("轉現貨失敗：" + error.message); setBusy(false); return; }
    onDone(`已將 ${q} 件轉為現貨 ✅`);
  };

  const statRow = (l,v,color) => <div style={{display:"flex",justifyContent:"space-between"}}><span>{l}</span><b style={color?{color}:undefined}>{v}</b></div>;

  return (
    <Modal onClose={onClose} maxWidth={480}>
      <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>採買配貨</div>
      <div style={{fontSize:13,color:C.muted,marginBottom:16}}>{target.product_name}{target.spec?` / ${target.spec}`:""}</div>
      {loading ? <div style={{color:C.muted,padding:20}}>載入中…</div> : (<>
        {/* 統計 */}
        <div style={{background:C.bgDeep,borderRadius:8,padding:"10px 14px",fontSize:13,lineHeight:1.9,marginBottom:14}}>
          {statRow("已訂購", totalOrdered)}
          {statRow("已採買（累計）", purchasedTotal)}
          {statRow("已配貨", `${allocatedTotal} / ${totalOrdered}`, allocatedTotal>=totalOrdered&&totalOrdered>0?C.green:C.amber)}
          <div style={{borderTop:`1px solid ${C.border}`,marginTop:4,paddingTop:4}}>{statRow("待分配池", Math.max(0,pool), C.accent)}</div>
        </div>

        {/* 新增採買批次 */}
        <div style={{border:`1.5px dashed ${C.border}`,borderRadius:10,padding:"12px 14px",marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>＋ 新增採買批次</div>
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
            <button onClick={addLot} disabled={busy} style={{flex:1,background:"#fff",color:C.accent,border:`1.5px solid ${C.accent}`,borderRadius:8,padding:"9px",fontSize:13,fontWeight:600,cursor:busy?"not-allowed":"pointer",whiteSpace:"nowrap"}}>只記採買</button>
            <button onClick={quickInbound} disabled={busy} style={{flex:2,background:C.accent,color:"#fff",border:"none",borderRadius:8,padding:"9px",fontSize:13,fontWeight:600,cursor:busy?"not-allowed":"pointer",whiteSpace:"nowrap"}}>一鍵入庫並配貨（FIFO）</button>
          </div>
          <div style={{fontSize:11,color:C.faint,marginTop:6}}>「一鍵入庫」＝記採買＋依訂單先來後到自動配滿，不夠的留在配貨清單。</div>
        </div>

        {/* 分配到訂單 */}
        <div style={{display:"flex",alignItems:"center",marginBottom:8}}>
          <div style={{fontSize:12,color:C.muted,fontWeight:600}}>分配到訂單（填配給該單的數量）</div>
          <button onClick={autoAllocate} style={{marginLeft:"auto",border:`1.5px solid ${C.accent}`,background:C.accentBg,color:C.accent,borderRadius:8,padding:"5px 12px",fontSize:12,cursor:"pointer"}}>自動分配</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12,maxHeight:200,overflowY:"auto"}}>
          {rows.length===0 ? <div style={{color:C.faint,fontSize:13,padding:12}}>目前沒有訂單</div> :
           rows.map(r=>{
            const full = Number(r.allocated)>=r.qty;
            return (
            <div key={r.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",border:`1.5px solid ${full?C.accent:C.border}`,borderRadius:10,background:full?C.accentBg:"#fff"}}>
              <div style={{flex:1,fontSize:13}}><b>#{r.no}</b> · {r.customer} <span style={{color:C.faint}}>訂 {r.qty}</span></div>
              <input type="number" value={r.allocated} onChange={e=>clampAlloc(r.id,e.target.value,r.qty)} style={{...inp,width:70,padding:"6px 8px",textAlign:"center"}}/>
              <span style={{fontSize:12,color:C.muted}}>/ {r.qty}</span>
            </div>
            );
          })}
        </div>

        {over && <div style={{fontSize:12,color:C.red,marginBottom:10}}>配貨總量已超過已採買，請先新增採買批次或減少配貨數量</div>}
        {err && <div style={{fontSize:12,color:C.red,background:C.redBg,padding:"8px 12px",borderRadius:8,marginBottom:10}}>{err}</div>}

        <button onClick={saveAlloc} disabled={busy} style={{width:"100%",background:C.accent,color:"#fff",border:"none",borderRadius:99,padding:"12px",fontSize:14,fontWeight:600,cursor:busy?"not-allowed":"pointer",opacity:busy?.6:1,marginBottom:14}}>儲存配貨</button>

        {/* 轉現貨：待分配池剩餘，隨時可轉 */}
        <div style={{borderTop:`1px solid ${C.borderLight}`,paddingTop:14}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>轉現貨（把待分配池剩餘轉為現貨）</div>
          <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
            <div style={{flex:1}}><label style={label}>數量（池剩 {Math.max(0,pool)}）</label><input type="number" value={convQty} onChange={e=>setConvQty(e.target.value)} style={inp} placeholder={String(Math.max(0,pool))}/></div>
            <div style={{flex:1}}><label style={label}>現貨售價 NT$</label><input type="number" value={convPrice} onChange={e=>setConvPrice(e.target.value)} style={inp} placeholder="0"/></div>
            <button onClick={convert} disabled={busy||pool<=0} style={{background:pool>0?C.green:C.bgDeep,color:pool>0?"#fff":C.faint,border:"none",borderRadius:8,padding:"9px 16px",fontSize:13,fontWeight:600,cursor:(busy||pool<=0)?"not-allowed":"pointer",whiteSpace:"nowrap"}}>轉現貨</button>
          </div>
        </div>
      </>)}
    </Modal>
  );
}

export function DistributionPage(){
  const [view, setView] = useState("summary"); // summary | items
  const [summary, setSummary] = useState([]);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(new Set());   // 展開「相關訂單」的列
  const toggleExpand = key => setExpanded(s => { const n=new Set(s); n.has(key)?n.delete(key):n.add(key); return n; });

  const load = async () => {
    setLoading(true);
    const [sumRes, itemRes] = await Promise.all([
      supabase.from("distribution_summary").select("*"),
      supabase.from("order_items").select("*, orders(no, customer_name, status), variant:product_variants(stock)").order("created_at",{ascending:false}),
    ]);
    setSummary(sumRes.data || []);
    // 只保留「代購」品項：排除已取消訂單，且排除現貨（variant.stock 有值）
    setItems((itemRes.data || []).filter(it => it.orders && it.orders.status !== "cancelled" && (!it.variant_id || it.variant?.stock == null)));
    setLoading(false);
  };
  useEffect(()=>{ load(); }, []);

  const [alloc, setAlloc] = useState(null);   // 採買配貨對象 {product_name, spec}
  const [toast, setToast] = useState("");
  const flash = m => { setToast(m); setTimeout(()=>setToast(""), 2800); };


  const sumFiltered = summary.filter(s => !search.trim() || (s.product_name||"").includes(search) || (s.spec||"").includes(search));
  const itemFiltered = items.filter(it => !search.trim() || (it.product_name||"").includes(search) || (it.spec||"").includes(search));

  const tabBtn = (v,l) => (
    <button onClick={()=>setView(v)} style={{padding:"8px 18px",borderRadius:99,fontSize:13,cursor:"pointer",border:`1.5px solid ${view===v?C.accent:C.border}`,background:view===v?C.accentBg:C.surface,color:view===v?C.accent:C.muted,fontWeight:view===v?600:400}}>{l}</button>
  );

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        <h2 style={{fontSize:18,fontWeight:700,margin:0}}>配貨採買</h2>
        <div style={{marginLeft:"auto"}}/>
        <button onClick={load} style={{border:`1px solid ${C.border}`,background:C.surface,borderRadius:99,padding:"6px 14px",fontSize:12,cursor:"pointer",color:C.textMid}}>重新整理</button>
      </div>

      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        {tabBtn("summary","商品彙總")}
        {tabBtn("items","訂單明細")}
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜尋 商品 / 規格"
          style={{flex:"1 1 200px",padding:"9px 14px",border:`1.5px solid ${C.border}`,borderRadius:99,fontSize:13}}/>
      </div>

      {loading ? <div style={{color:C.muted,padding:20}}>載入中…</div> :
       <div style={{overflowX:"auto",background:C.surface,borderRadius:C.r,boxShadow:C.shadow}}>
        {view==="summary" ? (
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>
              <th style={th}>商品名稱</th><th style={th}>規格</th><th style={th}>總訂購</th>
              <th style={th}>已採買</th><th style={th}>已配</th><th style={th}>未配</th><th style={th}>待配池</th><th style={th}>在手</th><th style={th}>缺貨</th>
              <th style={th}>訂單數</th><th style={th}>相關訂單</th><th style={th}>採買狀態</th><th style={th}>操作</th>
            </tr></thead>
            <tbody>
              {sumFiltered.length===0 ? <tr><td style={td} colSpan={13}>目前沒有資料</td></tr> :
               sumFiltered.map((s,i)=>(
                <tr key={i}>
                  <td style={{...td,fontWeight:500}}>{s.product_name}</td>
                  <td style={td}>{s.spec||"—"}</td>
                  <td style={{...td,fontWeight:700}}>{s.total_qty}</td>
                  <td style={{...td,fontWeight:600}}>{s.purchased_total}</td>
                  <td style={{...td,color:C.green}}>{s.purchased_qty}</td>
                  <td style={{...td,color:C.amber}}>{s.unpurchased_qty}</td>
                  <td style={{...td,color:C.accent,fontWeight:600}}>{s.pool_qty}</td>
                  <td style={{...td,fontWeight:600}}>{s.on_hand_qty}</td>
                  <td style={{...td,color:C.red}}>{s.out_of_stock_qty}</td>
                  <td style={td}>{s.order_count}</td>
                  <td style={{...td,whiteSpace:"normal",maxWidth:260}}>
                    {(()=>{
                      const nos=Array.isArray(s.order_nos)?s.order_nos:(s.order_nos?[s.order_nos]:[]);
                      const open=expanded.has(i);
                      const shown=open?nos:nos.slice(0,6);
                      return(
                        <div style={{display:"flex",flexWrap:"wrap",gap:4,alignItems:"center"}}>
                          {shown.map((no,idx)=><span key={idx} style={{fontSize:11,background:C.bgDeep,color:C.textMid,borderRadius:6,padding:"2px 7px",whiteSpace:"nowrap"}}>#{no}</span>)}
                          {nos.length>6&&<button onClick={()=>toggleExpand(i)} style={{fontSize:11,border:"none",background:"none",color:C.accent,cursor:"pointer",padding:"2px 4px",fontWeight:600}}>{open?"收合":`＋${nos.length-6} 更多`}</button>}
                        </div>
                      );
                    })()}
                  </td>
                  <td style={td}>{PURCHASE_LABEL[s.summary_status]||s.summary_status}</td>
                  <td style={td}><button onClick={()=>setAlloc({product_name:s.product_name,spec:s.spec||""})} style={{border:"none",background:C.accentBg,color:C.accent,borderRadius:8,padding:"5px 12px",fontSize:12,cursor:"pointer"}}>採買配貨</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>
              <th style={th}>訂單</th><th style={th}>客人</th><th style={th}>商品</th><th style={th}>規格</th>
              <th style={th}>數量</th><th style={th}>單價</th><th style={th}>小計</th><th style={th}>採買狀態</th>
            </tr></thead>
            <tbody>
              {itemFiltered.length===0 ? <tr><td style={td} colSpan={8}>目前沒有資料</td></tr> :
               itemFiltered.map(it=>(
                <tr key={it.id}>
                  <td style={td}>#{it.orders?.no}</td>
                  <td style={td}>{it.orders?.customer_name}</td>
                  <td style={{...td,fontWeight:500}}>{it.product_name}</td>
                  <td style={td}>{it.spec||"—"}</td>
                  <td style={td}>{it.qty}</td>
                  <td style={td}>{fmtMoney(it.price)}</td>
                  <td style={td}>{fmtMoney(it.price*it.qty)}</td>
                  <td style={td}>{PURCHASE_LABEL[it.purchase_status]||it.purchase_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
       </div>
      }

      {/* 採買配貨彈窗 */}
      {alloc && <AllocationModal target={alloc} onClose={()=>setAlloc(null)} onDone={(m)=>{ setAlloc(null); flash(m); load(); }}/>}

      {/* toast（取代原生 alert） */}
      {toast && <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:C.text,color:"#fff",padding:"11px 22px",borderRadius:99,fontSize:13,zIndex:200,boxShadow:C.shadow}}>{toast}</div>}
    </div>
  );
}
