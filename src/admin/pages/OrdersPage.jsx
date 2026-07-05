import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { C } from "../../theme";
import { fmtMoney } from "../../utils";
import { calcPayment, orderStage as stageOf } from "../adminUtils";
import { TW_BANKS } from "../../constants";
import { AddOrderModal } from "./AddOrderModal";

// 訂單流水線階段（顏色標籤；階段推導共用 adminUtils.orderStage）
const STAGES = [
  { key:"pending_review", label:"待審核", color:C.blue,   bg:C.blueBg   },
  { key:"to_purchase",    label:"待採買", color:C.amber,  bg:C.amberBg  },
  { key:"purchased",      label:"已採買", color:C.green,  bg:C.greenBg  },
  { key:"shipped",        label:"已寄出", color:C.purple, bg:C.purpleBg },
  { key:"arrived",        label:"已到台", color:C.accent, bg:C.accentBg },
  { key:"cancelled",      label:"已取消", color:C.red,    bg:C.redBg    },
];
const stageMeta = k => STAGES.find(s=>s.key===k) || STAGES[0];

// ─── 單張訂單卡（可展開詳情）──────────────────────────────────
function OrderCard({ o, onChange }){
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const p = calcPayment(o);
  const st = stageMeta(stageOf(o));
  const items = o.items || [];
  const profit = Number(o.profit)||0;          // 權威利潤（下單時伺服器算好）
  const cost = p.total - profit;               // 成本 = 總額 − 利潤
  const firstName = items[0] ? items[0].product_name + (items[0].spec?` / ${items[0].spec}`:"") : "—";
  const itemsLabel = items.length>1 ? `${firstName} 等 ${items.length} 件` : firstName;

  const openEdit = () => { setForm({ deposit_paid:o.deposit_paid||0, deposit_last5:o.deposit_last5||"", deposit_bank:o.deposit_bank||"", cod_received:o.cod_received||0 }); setEditing(true); };
  const setStage = async (stage) => {
    setBusy(true);
    let patch = {};
    if (stage==="pending_review") patch = { status:"pending_review", shipping_status:"pending" };
    else if (stage==="to_purchase"||stage==="purchased") patch = { status:"active", shipping_status:"pending" };
    else if (stage==="shipped") patch = { status:"active", shipping_status:"shipped" };
    else if (stage==="arrived") patch = { status:"active", shipping_status:"arrived" };
    else if (stage==="cancelled") patch = { status:"cancelled" };
    await supabase.from("orders").update({ ...patch, updated_at:new Date().toISOString() }).eq("id", o.id);
    if (stage==="cancelled") await supabase.rpc("restore_stock", { p_order_id:o.id });
    setBusy(false); onChange();
  };
  const savePayment = async () => {
    setBusy(true);
    await supabase.from("orders").update({ deposit_paid:Number(form.deposit_paid)||0, deposit_last5:form.deposit_last5||"", deposit_bank:form.deposit_bank||"", cod_received:Number(form.cod_received)||0, updated_at:new Date().toISOString() }).eq("id", o.id);
    setBusy(false); setEditing(false); onChange();
  };
  const delOrder = async () => { if(!window.confirm("確定刪除這張訂單？")) return; await supabase.from("orders").delete().eq("id", o.id); onChange(); };
  const archiveOrder = async () => { await supabase.from("orders").update({ archived:true, updated_at:new Date().toISOString() }).eq("id", o.id); onChange(); };

  const box = { background:C.surface, borderRadius:C.r, boxShadow:C.shadow, marginBottom:12, overflow:"hidden" };
  const pill = (bg,col,txt) => <span style={{background:bg,color:col,fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:99}}>{txt}</span>;
  const label = { fontSize:11, color:C.muted, marginBottom:3 };

  return (
    <div style={box}>
      {/* 摘要列 */}
      <div style={{padding:"16px 18px"}}>
        <div style={{display:"flex",alignItems:"flex-start"}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,color:C.faint}}>#{o.no} · {o.created_at?new Date(o.created_at).toLocaleDateString("zh-TW"):""}</div>
            <div style={{fontSize:15,fontWeight:600,color:C.text,marginTop:2}}>{o.customer_name||"匿名"}</div>
            <div style={{fontSize:13,color:C.muted,marginTop:3}}>{itemsLabel}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{marginBottom:6}}>{pill(st.bg,st.color,st.label)}</div>
            <div style={{fontSize:11,color:p.pending>0?C.amber:C.green}}>{p.paymentStatus}</div>
            <div style={{fontSize:18,fontWeight:700,color:C.text,marginTop:2}}>{fmtMoney(p.total)}</div>
          </div>
        </div>
        <div onClick={()=>setOpen(v=>!v)} style={{textAlign:"center",fontSize:12,color:C.muted,cursor:"pointer",marginTop:10,userSelect:"none"}}>{open?"▲ 收起":"▼ 展開詳情"}</div>
      </div>

      {open && (
        <div style={{borderTop:`1px solid ${C.borderLight}`,background:C.bgDeep,padding:"16px 18px"}}>
          {/* 概覽 */}
          <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>訂單概覽</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px 20px",fontSize:13,marginBottom:14}}>
            <div><div style={label}>訂單編號</div>#{o.no}</div>
            <div><div style={label}>客人</div>{o.customer_name||"匿名"}</div>
            <div><div style={label}>訂單狀態</div>{pill(st.bg,st.color,st.label)}</div>
            <div><div style={label}>付款狀態</div>{p.paymentStatus}</div>
            <div><div style={label}>總金額</div><b>{fmtMoney(p.total)}</b></div>
            <div><div style={label}>已付款</div><span style={{color:C.green}}>{fmtMoney(p.totalReceived)}</span></div>
            <div><div style={label}>未付款</div><span style={{color:p.pending>0?C.amber:C.green}}>{fmtMoney(p.pending)}</span></div>
            <div><div style={label}>下單日期</div>{o.created_at?new Date(o.created_at).toLocaleDateString("zh-TW"):""}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <span style={{fontSize:12,color:C.muted}}>更改狀態：</span>
            <select value={stageOf(o)} disabled={busy} onChange={e=>setStage(e.target.value)} style={{padding:"7px 12px",border:`1.5px solid ${C.border}`,borderRadius:8,fontSize:13,background:"#fff"}}>
              {STAGES.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>

          {/* 商品明細 */}
          <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>商品明細</div>
          {items.map(it=>{
            const done = it.allocated_qty!=null ? it.allocated_qty>=it.qty : it.purchase_status==="purchased";
            return (
              <div key={it.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.borderLight}`}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13}}>{done && <span style={{color:C.green,marginRight:6}}>✓已配貨</span>}{it.product_name}{it.spec?` / ${it.spec}`:""}</div>
                  <div style={{fontSize:11,color:C.faint}}>×{it.qty}</div>
                </div>
                <div style={{fontSize:13,fontWeight:600}}>{fmtMoney((it.price||0)*(it.qty||1))}</div>
              </div>
            );
          })}
          <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginTop:10,color:C.muted}}><span>商品小計</span><span>{fmtMoney(p.total)}</span></div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:C.muted}}><span>成本</span><span>{fmtMoney(cost)}</span></div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:700,color:C.green,paddingTop:4}}><span>利潤</span><span>{fmtMoney(profit)}</span></div>

          {/* 付款紀錄 */}
          <div style={{fontSize:13,fontWeight:700,margin:"16px 0 8px"}}>付款紀錄</div>
          {editing ? (
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:10}}>
              <div style={{display:"flex",gap:8}}>
                <div style={{flex:1}}><div style={label}>已收訂金/匯款</div><input type="number" value={form.deposit_paid} onChange={e=>setForm(f=>({...f,deposit_paid:e.target.value}))} style={{width:"100%",padding:"8px",border:`1.5px solid ${C.border}`,borderRadius:8,fontSize:13,boxSizing:"border-box"}}/></div>
                <div style={{flex:1}}><div style={label}>末5碼</div><input value={form.deposit_last5} onChange={e=>setForm(f=>({...f,deposit_last5:e.target.value}))} style={{width:"100%",padding:"8px",border:`1.5px solid ${C.border}`,borderRadius:8,fontSize:13,boxSizing:"border-box"}}/></div>
              </div>
              <div><div style={label}>匯款銀行</div>
                <select value={form.deposit_bank} onChange={e=>setForm(f=>({...f,deposit_bank:e.target.value}))} style={{width:"100%",padding:"8px",border:`1.5px solid ${C.border}`,borderRadius:8,fontSize:13,background:"#fff"}}>
                  <option value="">未指定</option>{TW_BANKS.map(b=><option key={b.code} value={`${b.code} ${b.name}`}>{b.code} {b.name}</option>)}
                </select>
              </div>
              <div><div style={label}>已收貨到付款</div><input type="number" value={form.cod_received} onChange={e=>setForm(f=>({...f,cod_received:e.target.value}))} style={{width:"100%",padding:"8px",border:`1.5px solid ${C.border}`,borderRadius:8,fontSize:13,boxSizing:"border-box"}}/></div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={savePayment} disabled={busy} style={{background:C.accent,color:"#fff",border:"none",borderRadius:8,padding:"8px 18px",fontSize:13,fontWeight:600,cursor:"pointer"}}>儲存</button>
                <button onClick={()=>setEditing(false)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 16px",fontSize:13,cursor:"pointer",color:C.muted}}>取消</button>
              </div>
            </div>
          ) : (<>
            <div style={{background:o.deposit_paid>0?C.greenBg:C.bgCard,border:`1px solid ${C.borderLight}`,borderRadius:8,padding:"10px 12px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:13,fontWeight:600,color:o.deposit_paid>0?C.green:C.muted}}>{o.deposit_paid>0?"✓ 訂金/匯款已收":"○ 未收款"}</div>{(o.deposit_bank||o.deposit_last5)&&<div style={{fontSize:11,color:C.muted}}>{o.deposit_bank} {o.deposit_last5?`· 末5碼:${o.deposit_last5}`:""}</div>}</div>
              <div style={{fontSize:15,fontWeight:700}}>{fmtMoney(o.deposit_paid||0)}</div>
            </div>
            {p.pending>0 && (
              <div style={{background:C.blueBg,borderRadius:8,padding:"10px 12px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontSize:13,fontWeight:600,color:C.blue}}>○ 尾款待收</div><div style={{fontSize:11,color:C.muted}}>總額 {fmtMoney(p.total)} − 已收 {fmtMoney(p.totalReceived)}</div></div>
                <div style={{fontSize:15,fontWeight:700,color:C.blue}}>{fmtMoney(p.pending)}</div>
              </div>
            )}
            <button onClick={openEdit} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:99,padding:"7px 16px",fontSize:12,cursor:"pointer",color:C.textMid}}>✏️ 編輯付款資訊</button>
          </>)}

          {/* 底部 */}
          <div style={{display:"flex",alignItems:"center",marginTop:16,paddingTop:12,borderTop:`1px solid ${C.borderLight}`}}>
            <div style={{fontSize:13,color:C.muted}}>成本 {fmtMoney(cost)} · <span style={{color:C.green,fontWeight:600}}>利潤 {fmtMoney(profit)}</span></div>
            <button onClick={archiveOrder} style={{marginLeft:"auto",background:C.bgDeep,color:C.textMid,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 12px",fontSize:12,cursor:"pointer",marginRight:8}}>📦 封存</button>
            <button onClick={delOrder} style={{background:C.redBg,color:C.red,border:"none",borderRadius:8,padding:"7px 12px",fontSize:12,cursor:"pointer"}}>🗑 刪除</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 訂單頁 ───────────────────────────────────────────────────
export function OrdersPage(){
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("orders").select("*, items:order_items(*)").order("created_at",{ascending:false});
    setOrders(data || []);
    setLoading(false);
  };
  useEffect(()=>{ load(); }, []);

  const visible = orders.filter(o=>!o.archived);   // 封存的移到封存區，不在此顯示
  const withStage = visible.map(o=>({ o, stage:stageOf(o) }));
  const counts = STAGES.reduce((m,s)=>{ m[s.key]=withStage.filter(x=>x.stage===s.key).length; return m; }, {});
  const totalProfit = visible.reduce((s,o)=>s+(Number(o.profit)||0),0);
  const toPurchase = counts.to_purchase || 0;
  const purchased = counts.purchased || 0;

  const filtered = withStage.filter(({o,stage})=>{
    const s = search.trim();
    if (s && !(String(o.no||"").includes(s) || String(o.customer_name||"").includes(s))) return false;
    if (filter!=="all" && stage!==filter) return false;
    return true;
  });

  const statCard = (icon,val,lab,active) => (
    <div style={{flex:1,minWidth:150,background:active?C.accent:C.surface,color:active?"#fff":C.text,borderRadius:C.r,boxShadow:C.shadow,padding:"18px 20px",textAlign:"center"}}>
      <div style={{fontSize:16,opacity:.7}}>{icon}</div>
      <div style={{fontSize:24,fontWeight:700,margin:"4px 0"}}>{val}</div>
      <div style={{fontSize:12,opacity:.8}}>{lab}</div>
    </div>
  );

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
        <h2 style={{fontSize:20,fontWeight:700,margin:0}}>訂單</h2>
        <button onClick={load} style={{marginLeft:"auto",border:`1px solid ${C.border}`,background:C.surface,borderRadius:99,padding:"6px 14px",fontSize:12,cursor:"pointer",color:C.textMid}}>重新整理</button>
        <button onClick={()=>setAdding(true)} style={{background:C.accent,color:"#fff",border:"none",borderRadius:99,padding:"7px 16px",fontSize:13,fontWeight:600,cursor:"pointer"}}>＋ 新增訂單</button>
      </div>
      {adding && <AddOrderModal onClose={()=>setAdding(false)} onCreated={()=>{ setAdding(false); load(); }}/>}

      {/* 統計卡 */}
      <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        {statCard("📋", visible.length, "總訂單", true)}
        {statCard("🕐", toPurchase, "待採買")}
        {statCard("✓", purchased, "已採買")}
        {statCard("＄", fmtMoney(totalProfit), "預估利潤")}
      </div>

      {/* 狀態膠囊 */}
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        {[{key:"all",label:"全部",count:visible.length},...STAGES.map(s=>({key:s.key,label:s.label,count:counts[s.key]||0}))].map(f=>(
          <button key={f.key} onClick={()=>setFilter(f.key)} style={{padding:"7px 16px",borderRadius:99,fontSize:13,cursor:"pointer",border:"none",fontWeight:filter===f.key?600:400,background:filter===f.key?C.accent:C.bgDeep,color:filter===f.key?"#fff":C.textMid}}>{f.label} ({f.count})</button>
        ))}
      </div>

      <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜尋 訂單編號 / 客人" style={{flex:"1 1 200px",padding:"9px 14px",border:`1.5px solid ${C.border}`,borderRadius:99,fontSize:13}}/>
        <div style={{fontSize:13,color:C.muted}}>顯示 {filtered.length} 筆</div>
      </div>

      {loading ? <div style={{color:C.muted,padding:20}}>載入中…</div> :
       filtered.length===0 ? <div style={{color:C.faint,padding:40,textAlign:"center",background:C.surface,borderRadius:C.r}}>沒有符合的訂單</div> :
       filtered.map(({o})=><OrderCard key={o.id} o={o} onChange={load}/>)
      }
    </div>
  );
}
