import { useState } from "react";
import { supabase } from "../../supabase";
import { C } from "../../theme";
import { fmtMoney } from "../../utils";
import { Modal } from "../ui";
import { TW_BANKS } from "../../constants";
import { logAction } from "../auditLog";

const blank = () => ({ key:Math.random().toString(36).slice(2), name:"", spec:"", price:"", qty:"1", cost:"" });

export function AddOrderModal({ onClose, onCreated }){
  const [customer, setCustomer] = useState("");
  const [rows, setRows] = useState([blank()]);
  const [payBank, setPayBank] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payLast5, setPayLast5] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const setRow = (key,patch) => setRows(rs=>rs.map(r=>r.key===key?{...r,...patch}:r));
  const addRow = () => setRows(rs=>[...rs, blank()]);
  const delRow = (key) => setRows(rs=>rs.length>1?rs.filter(r=>r.key!==key):rs);

  const total = rows.reduce((s,r)=>s+(Number(r.price)||0)*(Number(r.qty)||1),0);

  const create = async () => {
    setErr("");
    const items = rows.filter(r=>r.name.trim()).map(r=>({ product_name:r.name.trim(), spec:r.spec.trim(), qty:Math.max(1,Number(r.qty)||1), price:Number(r.price)||0, cost:Number(r.cost)||0 }));
    if (!items.length) { setErr("請至少填一項商品"); return; }
    setBusy(true);
    const p_order = {
      customer_name: customer.trim() || "手動客人",
      total,
      deposit_paid: Number(payAmount)||0,
      deposit_last5: payLast5||"",
      deposit_bank: payBank||"",
    };
    const { data, error } = await supabase.rpc("admin_create_order", { p_order, p_items: items });
    setBusy(false);
    if (error) { setErr("建立失敗："+error.message); return; }
    logAction("後台新增訂單", `#${data?.no} · ${p_order.customer_name}`);
    onCreated();
  };

  const inp = { width:"100%", background:"#fff", border:`1.5px solid ${C.border}`, borderRadius:8, padding:"8px 10px", fontSize:13, color:C.text, boxSizing:"border-box" };
  const lab = { fontSize:11, color:C.muted, display:"block", marginBottom:4 };

  return (
    <Modal onClose={onClose} maxWidth={520}>
      <div style={{ display:"flex", alignItems:"center", marginBottom:16 }}>
        <h2 style={{ fontSize:18, fontWeight:700, margin:0 }}>新增訂單</h2>
        <button onClick={onClose} style={{ marginLeft:"auto", width:32, height:32, borderRadius:"50%", border:"none", background:C.bgDeep, color:C.muted, fontSize:16, cursor:"pointer" }}>✕</button>
      </div>

      <div style={{ marginBottom:14 }}><label style={lab}>客人名稱</label><input value={customer} onChange={e=>setCustomer(e.target.value)} placeholder="手動客人 / 社群名" style={inp}/></div>

      <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>商品明細</div>
      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:10 }}>
        {rows.map(r=>(
          <div key={r.key} style={{ border:`1px solid ${C.border}`, borderRadius:10, padding:10 }}>
            <div style={{ display:"flex", gap:8, marginBottom:8 }}>
              <input value={r.name} onChange={e=>setRow(r.key,{name:e.target.value})} placeholder="商品名稱" style={{ ...inp, flex:2 }}/>
              <input value={r.spec} onChange={e=>setRow(r.key,{spec:e.target.value})} placeholder="款式(可空)" style={{ ...inp, flex:1 }}/>
              <button onClick={()=>delRow(r.key)} style={{ width:32, borderRadius:8, border:"none", background:C.redBg, color:C.red, cursor:"pointer" }}>✕</button>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <div style={{ flex:1 }}><label style={lab}>售價</label><input type="number" value={r.price} onChange={e=>setRow(r.key,{price:e.target.value})} style={inp} placeholder="0"/></div>
              <div style={{ flex:1 }}><label style={lab}>數量</label><input type="number" value={r.qty} onChange={e=>setRow(r.key,{qty:e.target.value})} style={inp}/></div>
              <div style={{ flex:1 }}><label style={lab}>成本</label><input type="number" value={r.cost} onChange={e=>setRow(r.key,{cost:e.target.value})} style={inp} placeholder="0"/></div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={addRow} style={{ background:C.accentBg, color:C.accent, border:"none", borderRadius:8, padding:"8px", fontSize:13, fontWeight:600, cursor:"pointer", width:"100%", marginBottom:14 }}>＋ 加一項</button>

      <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>付款（選填）</div>
      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        <select value={payBank} onChange={e=>setPayBank(e.target.value)} style={{ ...inp, flex:2 }}>
          <option value="">匯款銀行</option>{TW_BANKS.map(b=><option key={b.code} value={`${b.code} ${b.name}`}>{b.code} {b.name}</option>)}
        </select>
        <input type="number" value={payAmount} onChange={e=>setPayAmount(e.target.value)} placeholder="金額" style={{ ...inp, flex:1 }}/>
        <input value={payLast5} onChange={e=>setPayLast5(e.target.value.replace(/\D/g,"").slice(0,5))} placeholder="末5碼" style={{ ...inp, flex:1 }}/>
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderTop:`1px solid ${C.border}` }}>
        <span style={{ fontSize:13, color:C.muted }}>總金額</span>
        <span style={{ fontSize:20, fontWeight:700, color:C.accent }}>{fmtMoney(total)}</span>
      </div>

      {err && <div style={{ fontSize:12, color:C.red, background:C.redBg, padding:"8px 12px", borderRadius:8, marginTop:10 }}>{err}</div>}
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:16 }}>
        <button onClick={onClose} style={{ background:"transparent", border:`1.5px solid ${C.border}`, color:C.muted, borderRadius:99, padding:"10px 22px", fontSize:14, cursor:"pointer" }}>取消</button>
        <button onClick={create} disabled={busy} style={{ background:C.accent, color:"#fff", border:"none", borderRadius:99, padding:"10px 26px", fontSize:14, fontWeight:600, cursor:busy?"not-allowed":"pointer", opacity:busy?.6:1 }}>{busy?"建立中…":"建立訂單"}</button>
      </div>
    </Modal>
  );
}
