import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { C } from "../../theme";
import { fmtMoney } from "../../utils";
import { Modal } from "../ui";
import { TW_BANKS } from "../../constants";
import { logAction } from "../auditLog";

const blank = () => ({ key:Math.random().toString(36).slice(2), name:"", spec:"", price:"", qty:"1", cost:"" });

export function AddOrderModal({ onClose, onCreated }){
  const [customer, setCustomer] = useState("");
  const [customerLineId, setCustomerLineId] = useState(null);  // 選到既有客人才有；null=臨時客人
  const [allCust, setAllCust] = useState([]);
  const [showList, setShowList] = useState(false);
  const [rows, setRows] = useState([blank()]);

  // 聚合客人來源：會員 + 歷史訂單 + 許願清單
  useEffect(()=>{
    (async()=>{
      const [{ data:members }, { data:orders }, { data:wishes }] = await Promise.all([
        supabase.from("members").select("line_user_id, line_name, community_name, phone"),
        supabase.from("orders").select("customer_line_id, customer_name").order("created_at",{ascending:false}),
        supabase.from("wishlist").select("customer_line_id, customer_name"),
      ]);
      const map = {};
      (members||[]).forEach(m=>{ const k=m.line_user_id; if(!k)return; map[k]={ key:k, line_id:k, name:m.community_name||m.line_name||"會員", community:m.community_name||"", phone:m.phone||"", source:"會員" }; });
      (orders||[]).forEach(o=>{ const k=o.customer_line_id||o.customer_name; if(!k||map[k])return; map[k]={ key:k, line_id:o.customer_line_id||null, name:o.customer_name||"匿名", community:"", phone:"", source:"歷史訂單" }; });
      (wishes||[]).forEach(w=>{ const k=w.customer_line_id||w.customer_name; if(!k||map[k])return; map[k]={ key:k, line_id:w.customer_line_id||null, name:w.customer_name||"匿名", community:"", phone:"", source:"許願" }; });
      setAllCust(Object.values(map));
    })();
  },[]);
  const _cs = customer.trim();
  const custMatches = allCust.filter(c=> !_cs || c.name.includes(_cs) || c.community.includes(_cs) || (c.phone||"").includes(_cs));
  const [payMethod, setPayMethod] = useState("full_payment");
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
      customer_line_id: customerLineId || "",   // 空 → RPC 自動產生 manual:xxx（臨時客人）
      payment_method: payMethod,
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

      <div style={{ marginBottom:14, position:"relative" }}>
        <label style={lab}>客人</label>
        <input value={customer}
          onChange={e=>{ setCustomer(e.target.value); setCustomerLineId(null); setShowList(true); }}
          onFocus={()=>setShowList(true)} onBlur={()=>setTimeout(()=>setShowList(false),150)}
          placeholder="搜尋 會員/歷史客人/許願，或直接打字＝臨時客人" style={inp}/>
        {customerLineId && <div style={{ fontSize:11, color:C.green, marginTop:3 }}>✓ 已連結客人，訂單會出現在他的帳號</div>}
        {showList && (
          <div style={{ position:"absolute", zIndex:20, left:0, right:0, background:"#fff", border:`1px solid ${C.border}`, borderRadius:8, marginTop:4, maxHeight:200, overflowY:"auto", boxShadow:C.shadow }}>
            {custMatches.length===0 ? <div style={{ padding:"10px 12px", fontSize:12, color:C.faint }}>無符合，將以「{customer.trim()||"手動客人"}」建立臨時客人</div> :
             custMatches.slice(0,20).map(c=>(
              <div key={c.key} onMouseDown={()=>{ setCustomer(c.name); setCustomerLineId(c.line_id); setShowList(false); }}
                style={{ padding:"8px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:8, borderBottom:`1px solid ${C.borderLight}` }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13 }}>{c.name}{c.community&&c.community!==c.name?` @${c.community}`:""}</div>
                  {c.phone && <div style={{ fontSize:11, color:C.muted }}>{c.phone}</div>}
                </div>
                <span style={{ fontSize:10, color:C.muted, background:C.bgDeep, borderRadius:4, padding:"1px 6px", flexShrink:0 }}>{c.source}</span>
              </div>
            ))}
          </div>
        )}
      </div>

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
      <div style={{ marginBottom:8 }}>
        <select value={payMethod} onChange={e=>setPayMethod(e.target.value)} style={{ ...inp }}>
          <option value="full_payment">一次付清</option>
          <option value="deposit_cod">訂金＋尾款貨到</option>
          <option value="full_cod">全額貨到付款</option>
        </select>
      </div>
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
