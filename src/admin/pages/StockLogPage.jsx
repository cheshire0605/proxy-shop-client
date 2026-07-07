import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { C } from "../../theme";
import { th, td } from "../ui";

const REASON = { sale:"售出", reserve:"預約佔位", ship:"出庫（寄出）", cancel:"取消/釋放", restock:"進貨", convert:"轉現貨", adjust:"調整" };

export function StockLogPage(){
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("stock_movements")
      .select("*, variant:product_variants(spec, product:products(name)), order:orders(no)")
      .order("created_at", { ascending: false })
      .limit(300);
    setRows(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);


  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
        <h2 style={{fontSize:18,fontWeight:700,margin:0}}>庫存異動紀錄</h2>
        <div style={{marginLeft:"auto"}}/>
        <button onClick={load} style={{border:`1px solid ${C.border}`,background:C.surface,borderRadius:99,padding:"6px 14px",fontSize:12,cursor:"pointer",color:C.textMid}}>重新整理</button>
      </div>

      {loading ? <div style={{color:C.muted,padding:20}}>載入中…</div> :
       rows.length === 0 ? <div style={{color:C.faint,padding:40,textAlign:"center",background:C.surface,borderRadius:C.r}}>還沒有異動紀錄</div> :
       <div style={{overflowX:"auto",background:C.surface,borderRadius:C.r,boxShadow:C.shadow}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>
            <th style={th}>時間</th><th style={th}>商品</th><th style={th}>規格</th>
            <th style={th}>異動</th><th style={th}>原因</th><th style={th}>訂單</th>
          </tr></thead>
          <tbody>
            {rows.map(m => (
              <tr key={m.id}>
                <td style={td}>{m.created_at ? new Date(m.created_at).toLocaleString("zh-TW") : ""}</td>
                <td style={{...td,fontWeight:500}}>{m.variant?.product?.name || "—"}</td>
                <td style={td}>{m.variant?.spec || "—"}</td>
                <td style={{...td,fontWeight:700,color:m.delta>=0?C.green:C.red}}>{m.delta>=0?`+${m.delta}`:m.delta}</td>
                <td style={td}>{REASON[m.reason] || m.reason}</td>
                <td style={td}>{m.order?.no ? `#${m.order.no}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
       </div>
      }
    </div>
  );
}
