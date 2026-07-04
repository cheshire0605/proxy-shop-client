import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabase";
import { C } from "../../theme";
import { fmtMoney } from "../../utils";
import { calcPayment, PAYMENT_METHOD_LABEL, SHIPPING_LABEL, ORDER_LABEL } from "../adminUtils";
import { th, td } from "../ui";

export function OrdersPage(){
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [shipFilter, setShipFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*, items:order_items(*)")
      .order("created_at", { ascending: false });
    if (!error) setOrders(data || []);
    setLoading(false);
  };
  useEffect(()=>{ load(); }, []);

  const filtered = orders.filter(o => {
    const s = search.trim();
    if (s && !(String(o.no||"").includes(s) || String(o.customer_name||"").includes(s))) return false;
    if (shipFilter !== "all" && (o.shipping_status||"pending") !== shipFilter) return false;
    return true;
  });


  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        <h2 style={{fontSize:18,fontWeight:700,margin:0}}>訂單管理</h2>
        <div style={{marginLeft:"auto",fontSize:13,color:C.muted}}>{filtered.length} 筆</div>
        <button onClick={load} style={{border:`1px solid ${C.border}`,background:C.surface,borderRadius:99,padding:"6px 14px",fontSize:12,cursor:"pointer",color:C.textMid}}>重新整理</button>
      </div>

      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜尋 訂單編號 / 客人姓名"
          style={{flex:"1 1 220px",padding:"9px 14px",border:`1.5px solid ${C.border}`,borderRadius:99,fontSize:13}}/>
        <select value={shipFilter} onChange={e=>setShipFilter(e.target.value)}
          style={{padding:"9px 14px",border:`1.5px solid ${C.border}`,borderRadius:99,fontSize:13,background:C.surface}}>
          <option value="all">全部出貨狀態</option>
          {Object.entries(SHIPPING_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {loading ? <div style={{color:C.muted,padding:20}}>載入中…</div> :
       filtered.length === 0 ? <div style={{color:C.faint,padding:40,textAlign:"center",background:C.surface,borderRadius:C.r}}>沒有符合的訂單</div> :
       <div style={{overflowX:"auto",background:C.surface,borderRadius:C.r,boxShadow:C.shadow}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>
            <th style={th}>編號</th><th style={th}>下單時間</th><th style={th}>客人</th>
            <th style={th}>總額</th><th style={th}>付款方式</th><th style={th}>付款狀態</th>
            <th style={th}>可出貨</th><th style={th}>出貨狀態</th><th style={th}>訂單</th><th style={th}></th>
          </tr></thead>
          <tbody>
            {filtered.map(o=>{
              const p = calcPayment(o);
              return (
                <tr key={o.id}>
                  <td style={td}>#{o.no}</td>
                  <td style={td}>{o.created_at ? new Date(o.created_at).toLocaleDateString("zh-TW") : ""}</td>
                  <td style={td}>{o.customer_name}</td>
                  <td style={td}>{fmtMoney(p.total)}</td>
                  <td style={td}>{PAYMENT_METHOD_LABEL[o.payment_method]||o.payment_method}</td>
                  <td style={{...td,color:p.pending>0?C.amber:C.green}}>{p.paymentStatus}</td>
                  <td style={td}>{p.shippable}</td>
                  <td style={td}>{SHIPPING_LABEL[o.shipping_status]||o.shipping_status}</td>
                  <td style={{...td,color:o.status==="cancelled"?C.red:C.muted}}>{ORDER_LABEL[o.status]||o.status}</td>
                  <td style={td}><Link to={`/admin/orders/${o.id}`} style={{color:C.accent,fontSize:12}}>詳細 ›</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
       </div>
      }
    </div>
  );
}
