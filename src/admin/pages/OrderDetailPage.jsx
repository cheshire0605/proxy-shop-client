import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "../../supabase";
import { C } from "../../theme";
import { fmtMoney } from "../../utils";
import { calcPayment, PAYMENT_METHOD_LABEL, SHIPPING_LABEL, PURCHASE_LABEL } from "../adminUtils";
import { box, label, inp } from "../ui";

export function OrderDetailPage(){
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    const { data } = await supabase.from("orders").select("*, items:order_items(*)").eq("id", id).single();
    if (data) {
      setOrder(data);
      setItems((data.items||[]).slice().sort((a,b)=>(a.created_at||"").localeCompare(b.created_at||"")));
      setForm({
        payment_method: data.payment_method || "full_payment",
        deposit_paid: data.deposit_paid || 0,
        cod_received: data.cod_received || 0,
        deposit_last5: data.deposit_last5 || "",
        shipping_status: data.shipping_status || "pending",
        logistics: data.logistics || "",
        tracking_no: data.tracking_no || "",
        shipping_notes: data.shipping_notes || "",
        notes: data.notes || "",
        status: data.status || "pending_review",
      });
    }
  };
  useEffect(()=>{ load(); }, [id]);

  if (!order) return <div style={{color:C.muted}}>載入中…（或找不到此訂單）<div><Link to="/admin/orders" style={{color:C.accent}}>← 回訂單列表</Link></div></div>;

  const p = calcPayment({ ...order, ...form });
  const set = (k,v) => setForm(f=>({ ...f, [k]: v }));

  // 審核/取消：點擊後直接寫入資料庫（不需再按儲存變更）
  const updateStatus = async (newStatus) => {
    setMsg("");
    const { error } = await supabase.from("orders").update({ status:newStatus, updated_at:new Date().toISOString() }).eq("id", id);
    if (error) { setMsg("更新失敗：" + error.message); return; }
    if (newStatus === "cancelled") { await supabase.rpc("restore_stock", { p_order_id: id }); }  // 回補現貨庫存
    setForm(f=>({ ...f, status:newStatus }));
    setOrder(o=>({ ...o, status:newStatus }));
    setMsg(newStatus==="active" ? "已審核通過 ✅" : newStatus==="cancelled" ? "已取消訂單" : "已更新");
  };

  const save = async () => {
    setSaving(true); setMsg("");
    const { error } = await supabase.from("orders").update({
      payment_method: form.payment_method,
      deposit_paid: Number(form.deposit_paid)||0,
      cod_received: Number(form.cod_received)||0,
      deposit_last5: form.deposit_last5,
      shipping_status: form.shipping_status,
      logistics: form.logistics,
      tracking_no: form.tracking_no,
      shipping_notes: form.shipping_notes,
      notes: form.notes,
      status: form.status,
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    setSaving(false);
    if (error) { setMsg("儲存失敗：" + error.message); return; }
    setMsg("已儲存 ✅"); load();
  };

  const setItemPurchase = async (itemId, status) => {
    setItems(items.map(it => it.id===itemId ? { ...it, purchase_status: status } : it));
    await supabase.from("order_items").update({ purchase_status: status }).eq("id", itemId);
  };

  const h3 = { fontSize:14, fontWeight:700, marginBottom:14, color:C.textMid };
  const row = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 };

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
        <Link to="/admin/orders" style={{color:C.accent,fontSize:13,textDecoration:"none"}}>← 訂單列表</Link>
        <h2 style={{fontSize:18,fontWeight:700,margin:0}}>訂單 #{order.no}</h2>
        <div style={{marginLeft:"auto",display:"flex",gap:8}}>
          {order.status==="pending_review" && (
            <button onClick={()=>updateStatus("active")} style={{background:C.green,color:"#fff",border:"none",borderRadius:99,padding:"7px 16px",fontSize:13,cursor:"pointer"}}>審核通過</button>
          )}
          {order.status!=="cancelled" && (
            <button onClick={()=>{ if(window.confirm("確定取消這張訂單？")) updateStatus("cancelled"); }} style={{background:C.redBg,color:C.red,border:`1px solid ${C.red}40`,borderRadius:99,padding:"7px 16px",fontSize:13,cursor:"pointer"}}>取消訂單</button>
          )}
        </div>
      </div>

      {/* 客人資料 */}
      <div style={box}>
        <div style={h3}>客人資料</div>
        <div style={{fontSize:13,lineHeight:2}}>
          <div>姓名：{order.customer_name}</div>
          <div>LINE ID：{order.customer_line_id}</div>
          <div>下單時間：{order.created_at ? new Date(order.created_at).toLocaleString("zh-TW") : ""}</div>
        </div>
      </div>

      {/* 收件資料（此訂單） */}
      <div style={box}>
        <div style={h3}>收件資料（此訂單）</div>
        <div style={{fontSize:13,lineHeight:2}}>
          <div>收件人：{order.recipient_name || "—"}</div>
          <div>電話：{order.recipient_phone || "—"}</div>
          <div>7-11 門市：{order.recipient_store || "—"}</div>
        </div>
      </div>

      {/* 付款資料 */}
      <div style={box}>
        <div style={h3}>付款資料</div>
        <div style={row}>
          <div>
            <label style={label}>付款方式</label>
            <select style={inp} value={form.payment_method} onChange={e=>set("payment_method",e.target.value)}>
              {Object.entries(PAYMENT_METHOD_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div><label style={label}>匯款末5碼</label><input style={inp} value={form.deposit_last5} onChange={e=>set("deposit_last5",e.target.value)}/></div>
          <div><label style={label}>已收（訂金/匯款）金額</label><input style={inp} type="number" value={form.deposit_paid} onChange={e=>set("deposit_paid",e.target.value)}/></div>
          <div><label style={label}>已收貨到付款</label><input style={inp} type="number" value={form.cod_received} onChange={e=>set("cod_received",e.target.value)}/></div>
        </div>
        <div style={{background:C.bgDeep,borderRadius:C.rSm,padding:"12px 14px",fontSize:13,lineHeight:1.9}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>訂單總金額</span><b>{fmtMoney(p.total)}</b></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>已收總額</span><span>{fmtMoney(p.totalReceived)}</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>待收金額</span><span style={{color:p.pending>0?C.amber:C.green}}>{fmtMoney(p.pending)}</span></div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:6,paddingTop:6,borderTop:`1px solid ${C.border}`}}><span>付款狀態</span><b>{p.paymentStatus}</b></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>可出貨狀態</span><b style={{color:C.accent}}>{p.shippable}</b></div>
        </div>
      </div>

      {/* 商品明細（可改採買狀態） */}
      <div style={box}>
        <div style={h3}>商品明細</div>
        {items.map(it=>(
          <div key={it.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.borderLight}`,flexWrap:"wrap"}}>
            <div style={{flex:"1 1 200px",minWidth:0}}>
              <div style={{fontSize:13,fontWeight:500}}>{it.product_name}{it.spec?` / ${it.spec}`:""}</div>
              <div style={{fontSize:12,color:C.muted}}>× {it.qty} · {fmtMoney(it.price)}／件 · 小計 {fmtMoney(it.price*it.qty)}</div>
            </div>
            <select value={it.purchase_status||"unpurchased"} onChange={e=>setItemPurchase(it.id,e.target.value)}
              style={{padding:"7px 10px",border:`1.5px solid ${C.border}`,borderRadius:C.rSm,fontSize:12,background:"#fff"}}>
              {Object.entries(PURCHASE_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        ))}
        <div style={{textAlign:"right",marginTop:12,fontSize:15,fontWeight:700}}>合計 {fmtMoney(p.total)}</div>
      </div>

      {/* 出貨資料 */}
      <div style={box}>
        <div style={h3}>出貨資料</div>
        <div style={row}>
          <div>
            <label style={label}>出貨狀態</label>
            <select style={inp} value={form.shipping_status} onChange={e=>set("shipping_status",e.target.value)}>
              {Object.entries(SHIPPING_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div><label style={label}>物流方式</label><input style={inp} value={form.logistics} onChange={e=>set("logistics",e.target.value)} placeholder="賣貨便 / 7-11…"/></div>
          <div><label style={label}>物流單號</label><input style={inp} value={form.tracking_no} onChange={e=>set("tracking_no",e.target.value)}/></div>
          <div><label style={label}>出貨備註</label><input style={inp} value={form.shipping_notes} onChange={e=>set("shipping_notes",e.target.value)}/></div>
        </div>
        <div><label style={label}>訂單備註</label><input style={inp} value={form.notes} onChange={e=>set("notes",e.target.value)}/></div>
      </div>

      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <button onClick={save} disabled={saving} style={{background:C.accent,color:"#fff",border:"none",borderRadius:99,padding:"12px 32px",fontSize:14,fontWeight:600,cursor:saving?"not-allowed":"pointer",opacity:saving?.5:1}}>{saving?"儲存中…":"儲存變更"}</button>
        {msg && <span style={{fontSize:13,color:msg.includes("失敗")?C.red:C.green}}>{msg}</span>}
      </div>
    </div>
  );
}
