import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { C } from "../../theme";
import { fmtMoney } from "../../utils";
import { PURCHASE_LABEL } from "../adminUtils";
import { th, td, inp, label, Modal } from "../ui";

export function DistributionPage(){
  const [view, setView] = useState("summary"); // summary | items
  const [summary, setSummary] = useState([]);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

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

  const [conv, setConv] = useState(null);  // 轉現貨暫存 {product_name,spec,qty,price}
  const doConvert = async () => {
    const { error } = await supabase.rpc("convert_to_stock", {
      p_name: conv.product_name, p_spec: conv.spec || "",
      p_price: Number(conv.price) || 0, p_qty: Number(conv.qty) || 0, p_image: "📦",
    });
    if (error) { alert(error.message); return; }
    setConv(null); alert("已轉為現貨 ✅（可到「現貨管理」調整）");
  };


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
              <th style={th}>已採買</th><th style={th}>未採買</th><th style={th}>缺貨</th>
              <th style={th}>訂單數</th><th style={th}>相關訂單</th><th style={th}>採買狀態</th><th style={th}>操作</th>
            </tr></thead>
            <tbody>
              {sumFiltered.length===0 ? <tr><td style={td} colSpan={10}>目前沒有資料</td></tr> :
               sumFiltered.map((s,i)=>(
                <tr key={i}>
                  <td style={{...td,fontWeight:500}}>{s.product_name}</td>
                  <td style={td}>{s.spec||"—"}</td>
                  <td style={{...td,fontWeight:700}}>{s.total_qty}</td>
                  <td style={{...td,color:C.green}}>{s.purchased_qty}</td>
                  <td style={{...td,color:C.amber}}>{s.unpurchased_qty}</td>
                  <td style={{...td,color:C.red}}>{s.out_of_stock_qty}</td>
                  <td style={td}>{s.order_count}</td>
                  <td style={{...td,whiteSpace:"normal",maxWidth:200,fontSize:12,color:C.muted}}>{Array.isArray(s.order_nos)?s.order_nos.join("、"):s.order_nos}</td>
                  <td style={td}>{PURCHASE_LABEL[s.summary_status]||s.summary_status}</td>
                  <td style={td}><button onClick={()=>setConv({product_name:s.product_name,spec:s.spec||"",qty:s.purchased_qty||s.total_qty||0,price:0})} style={{border:"none",background:C.accentBg,color:C.accent,borderRadius:8,padding:"5px 12px",fontSize:12,cursor:"pointer"}}>轉現貨</button></td>
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

      {/* 轉現貨彈窗 */}
      {conv && (
        <Modal onClose={()=>setConv(null)} maxWidth={380}>
          <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>轉為現貨</div>
          <div style={{fontSize:13,color:C.muted,marginBottom:16}}>{conv.product_name}{conv.spec?` / ${conv.spec}`:""}</div>
          <label style={label}>現貨數量</label>
          <input type="number" value={conv.qty} onChange={e=>setConv({...conv,qty:e.target.value})} style={{...inp,marginBottom:12}}/>
          <label style={label}>現貨售價 NT$</label>
          <input type="number" value={conv.price} onChange={e=>setConv({...conv,price:e.target.value})} style={inp}/>
          <div style={{display:"flex",gap:10,marginTop:18}}>
            <button onClick={doConvert} style={{flex:1,background:C.accent,color:"#fff",border:"none",borderRadius:99,padding:"11px",fontSize:14,fontWeight:600,cursor:"pointer"}}>建立現貨</button>
            <button onClick={()=>setConv(null)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:99,padding:"11px 20px",fontSize:14,cursor:"pointer",color:C.muted}}>取消</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
