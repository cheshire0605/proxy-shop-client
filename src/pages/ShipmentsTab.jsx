import { useState } from "react";
import { C } from "../theme";
import { Card, StatusPill } from "../components/ui";
import { fmtMoney, custOrderState, isImgSrc } from "../utils";

// ─── 出貨 Tab ─────────────────────────────────────────────────────
// (賣貨便連結改從 Supabase settings 表讀取)

export function ShipmentsTab({orders, shopeeUrl}){
  const [filter,setFilter]=useState("active"); // active=進行中 / done=已完成
  const canCheckout = o => o.shipping_status === "arrived" || o.shipping_status === "shipped"; // 可結單(顯示賣貨便按鈕)
  const isDone      = o => o.shipping_status === "completed";           // 已完成
  const isActive    = o => o.status !== "cancelled" && !isDone(o);      // 進行中:其他

  const filtered = orders.filter(o => {
    if (filter === "active") return isActive(o);
    if (filter === "done")   return isDone(o);
    return false;
  });

  const activeCount = orders.filter(o => isActive(o)).length;
  const doneCount = orders.filter(o => isDone(o)).length;

  return(
    <div style={{padding:"16px 16px 100px",display:"flex",flexDirection:"column",gap:14}}>
      {/* 兩個 tab */}
      <div style={{display:"flex",background:C.bgDeep,borderRadius:12,padding:4,gap:0}}>
        <button onClick={()=>setFilter("active")}
          style={{flex:1,padding:"10px 12px",borderRadius:9,border:"none",fontSize:13,fontWeight:filter==="active"?600:400,cursor:"pointer",background:filter==="active"?"#fff":"transparent",color:filter==="active"?C.text:C.muted,boxShadow:filter==="active"?"0 2px 6px rgba(0,0,0,.06)":"none",transition:"all .15s"}}>
          🚚 進行中 <span style={{fontSize:11,opacity:.7,marginLeft:4}}>({activeCount})</span>
        </button>
        <button onClick={()=>setFilter("done")}
          style={{flex:1,padding:"10px 12px",borderRadius:9,border:"none",fontSize:13,fontWeight:filter==="done"?600:400,cursor:"pointer",background:filter==="done"?"#fff":"transparent",color:filter==="done"?C.text:C.muted,boxShadow:filter==="done"?"0 2px 6px rgba(0,0,0,.06)":"none",transition:"all .15s"}}>
          ✓ 已完成 <span style={{fontSize:11,opacity:.7,marginLeft:4}}>({doneCount})</span>
        </button>
      </div>

      {!filtered.length
        ?<Card style={{padding:"40px 20px",textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:8}}>{filter==="active"?"📦":"✓"}</div>
          <div style={{fontSize:13,color:C.faint}}>{filter==="active"?"沒有進行中的訂單":"沒有已完成的訂單"}</div>
        </Card>
        :filtered.map((o,i)=>{
          const createdDate=o.created_at?new Date(o.created_at).toLocaleDateString("zh-TW",{month:"numeric",day:"numeric"}):(o.createdAt||"");
          const itemsTotal=(o.items||[]).reduce((s,it)=>s+(Number(it.price)||0)*(Number(it.qty)||1),0);
          const shippingFee=Number(o.shipping_fee||o.shippingFee||0);
          const grandTotal=itemsTotal+shippingFee;
          return(
            <Card key={o.id} className="fadeUp" style={{animationDelay:`${i*.04}s`,padding:0,overflow:"hidden"}}>
              {/* 訂單頭部 */}
              <div style={{padding:"14px 18px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${C.borderLight}`}}>
                <div>
                  <div style={{fontSize:11,color:C.faint,marginBottom:2}}>#{o.no}</div>
                  <div style={{fontSize:13,fontWeight:500,color:C.text}}>📅 {createdDate}</div>
                </div>
                <StatusPill status={custOrderState(o)}/>
              </div>

              {/* 條列式品項明細 */}
              <div style={{padding:"14px 18px"}}>
                <div style={{fontSize:10,color:C.faint,letterSpacing:1,marginBottom:10,fontWeight:600}}>商品明細</div>
                {(o.items||[]).map((it,idx)=>(
                  <div key={idx} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 0",borderBottom:idx<(o.items.length-1)?`0.5px dashed ${C.borderLight}`:"none"}}>
                    {isImgSrc(it.image)?(
                      <img src={it.image} alt="" style={{width:42,height:42,borderRadius:8,objectFit:"cover",flexShrink:0}}/>
                    ):(
                      <div style={{width:42,height:42,borderRadius:8,background:C.bgDeep,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🛒</div>
                    )}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,color:C.text,fontWeight:500,lineHeight:1.3}}>{it.name}</div>
                      {it.note&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>{it.note}</div>}
                      <div style={{fontSize:11,color:C.faint,marginTop:3}}>× {it.qty}</div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:C.accent}}>{fmtMoney((it.price||0)*(it.qty||1))}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 金額明細 */}
              <div style={{padding:"12px 18px",background:C.bgDeep,borderTop:`1px dashed ${C.borderLight}`}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,padding:"3px 0"}}>
                  <span>商品小計</span><span>{fmtMoney(itemsTotal)}</span>
                </div>
                {shippingFee>0&&(
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,padding:"3px 0"}}>
                    <span>運費</span><span>{fmtMoney(shippingFee)}</span>
                  </div>
                )}
                <div style={{display:"flex",justifyContent:"space-between",fontSize:15,fontWeight:600,color:C.text,paddingTop:8,marginTop:6,borderTop:`1px solid ${C.borderLight}`}}>
                  <span>TOTAL</span>
                  <span style={{color:C.accent,fontSize:18,fontWeight:700}}>{fmtMoney(grandTotal)}</span>
                </div>
              </div>

              {/* 賣貨便結單按鈕 (已到台/已寄出 才出現) */}
              {canCheckout(o) && shopeeUrl && (
                <a href={shopeeUrl} target="_blank" rel="noopener noreferrer"
                  style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"14px",background:C.text,color:"#fff",textDecoration:"none",fontSize:14,fontWeight:600,letterSpacing:.5}}>
                  下一步至賣貨便結單
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H8M17 7v9"/></svg>
                </a>
              )}
            </Card>
          );
        })
      }
    </div>
  );
}
