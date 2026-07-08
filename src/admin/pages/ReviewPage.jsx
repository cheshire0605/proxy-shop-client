import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { C } from "../../theme";
import { fmtMoney } from "../../utils";
import { logAction } from "../auditLog";

export function ReviewPage(){
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const flash = m => { setToast(m); setTimeout(()=>setToast(""), 2400); };

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("orders").select("*, items:order_items(*)").eq("status","pending_review").order("created_at",{ascending:false});
    setOrders(data || []); setLoading(false);
  };
  useEffect(()=>{ load(); }, []);

  const approve = async (o) => {
    const { error } = await supabase.from("orders").update({ status:"active", updated_at:new Date().toISOString() }).eq("id", o.id);
    if (error) { flash("更新失敗"); return; }
    logAction("審核通過", `訂單 #${o.no} · ${o.customer_name||"匿名"}`);
    flash("已審核通過 ✅"); load();
  };
  const reject = async (o) => {
    const reason = window.prompt(`拒絕訂單 #${o.no} 的原因（選填，會記在訂單上；按取消放棄）：`, "");
    if (reason===null) return;
    const { error } = await supabase.from("orders").update({ status:"cancelled", cancel_reason:reason.slice(0,200), updated_at:new Date().toISOString() }).eq("id", o.id);
    if (error) { flash("更新失敗"); return; }
    await supabase.rpc("restore_stock", { p_order_id:o.id });
    logAction("拒絕訂單", `訂單 #${o.no} · ${o.customer_name||"匿名"}${reason?` · ${reason}`:""}`);
    flash("已拒絕並取消"); load();
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12, maxWidth:640 }}>
      <div style={{ fontWeight:700, fontSize:16, color:C.accentDark }}>待審核（{orders.length}）</div>
      {loading ? <div style={{ color:C.muted, padding:20 }}>載入中…</div> :
       !orders.length ? <div style={{ textAlign:"center", padding:"36px 0", background:C.surface, borderRadius:C.r, color:C.muted }}>✨ 沒有待審核訂單</div> :
       orders.map(o=>(
        <div key={o.id} style={{ background:C.surface, borderRadius:C.r, boxShadow:C.shadow, padding:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <div style={{ fontWeight:700 }}>{o.customer_name||"匿名"} · #{o.no}</div>
            <div style={{ fontWeight:700, color:C.accentDark }}>{fmtMoney(o.total)}</div>
          </div>
          <div style={{ fontSize:13, color:C.muted, marginBottom:12 }}>{(o.items||[]).map(it=>`${it.product_name}${it.spec?`/${it.spec}`:""} ×${it.qty}`).join("・")}</div>
          {(o.deposit_bank||o.deposit_paid>0) && <div style={{ fontSize:12, color:C.muted, marginBottom:12 }}>匯款：{o.deposit_bank} {o.deposit_last5?`末5碼 ${o.deposit_last5}`:""} · NT${o.deposit_paid||0}</div>}
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>approve(o)} style={{ background:C.green, color:"#fff", border:"none", borderRadius:8, padding:"8px 18px", fontSize:13, fontWeight:600, cursor:"pointer" }}>✅ 審核通過</button>
            <button onClick={()=>reject(o)} style={{ background:C.redBg, color:C.red, border:`1px solid ${C.red}40`, borderRadius:8, padding:"8px 18px", fontSize:13, fontWeight:600, cursor:"pointer" }}>❌ 拒絕</button>
          </div>
        </div>
      ))}
      {toast && <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", background:C.text, color:"#fff", padding:"11px 22px", borderRadius:99, fontSize:13, zIndex:200, boxShadow:C.shadow }}>{toast}</div>}
    </div>
  );
}
