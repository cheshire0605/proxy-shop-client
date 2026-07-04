import { useState } from "react";
import { C } from "../theme";
import { Card, StatusPill } from "../components/ui";
import { parseItemName, fmtMoney, custOrderState, isImgSrc } from "../utils";

// ─── 訂單 Tab ─────────────────────────────────────────────────────
export function OrdersTab({orders}){
  const [filter,setFilter]=useState("all");

  // 出貨維度的進度步驟（客人視角）
  const STEPS=[
    {key:"pending_review",label:"審核中"},
    {key:"preparing",label:"備貨中"},
    {key:"shipped",label:"已寄出"},
    {key:"arrived",label:"已到台"},
    {key:"completed",label:"完成"},
  ];
  const stepIdx=(o)=>{
    if(o.status==="pending_review")return 0;
    const s=o.shipping_status||"pending";
    if(s==="pending"||s==="preparing")return 1;
    if(s==="shipped")return 2;
    if(s==="arrived")return 3;
    if(s==="completed")return 4;
    return 1;
  };
  const isShippedLike=(o)=>["shipped","arrived","completed"].includes(o.shipping_status);

  const filtered=orders.filter(o=>{
    if(filter==="unshipped")return o.status!=="cancelled"&&!isShippedLike(o);
    if(filter==="shipped"){const d=new Date();d.setMonth(d.getMonth()-3);return isShippedLike(o)&&new Date(o.created_at||o.createdAt)>d;}
    return true;
  });

  return(
    <div style={{padding:"16px 16px 100px",display:"flex",flexDirection:"column",gap:14}}>
      {/* 篩選 */}
      <div style={{display:"flex",alignItems:"center",gap:8,overflowX:"auto",scrollbarWidth:"none"}}>
        {[["all","全部"],["unshipped","未出貨"],["shipped","已出貨"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{padding:"7px 16px",borderRadius:99,fontSize:12,whiteSpace:"nowrap",cursor:"pointer",transition:"all .15s",border:`1.5px solid ${filter===v?C.accent:C.border}`,background:filter===v?C.accentBg:"transparent",color:filter===v?C.accent:C.muted,fontWeight:filter===v?500:400}}>
            {l}
          </button>
        ))}
        <div style={{marginLeft:"auto",fontSize:12,color:C.faint,whiteSpace:"nowrap"}}>{filtered.length} 筆</div>
      </div>

      {!filtered.length
        ?<Card style={{padding:"40px 20px",textAlign:"center"}}><div style={{fontSize:32,marginBottom:8}}>📋</div><div style={{fontSize:13,color:C.faint}}>目前沒有符合條件的訂單</div></Card>
        :filtered.map((o,i)=>{
          const createdDate=o.created_at?new Date(o.created_at).toLocaleDateString("zh-TW"):(o.createdAt||"");
          const isCancelled=o.status==="cancelled";
          const curIdx=stepIdx(o);
          const items=o.items||[];

          return(
            <Card key={o.id} className="fadeUp" style={{animationDelay:`${i*.04}s`,overflow:"hidden"}}>
              {/* Header */}
              <div style={{padding:"16px 18px 14px",borderBottom:`1px solid ${C.borderLight}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <div style={{fontSize:11,color:C.faint,letterSpacing:.3}}>#{o.no} · {createdDate}</div>
                  <StatusPill status={custOrderState(o)}/>
                </div>
                <div style={{fontSize:14,fontWeight:600,color:C.text}}>
                  {parseItemName(items[0]?.name).mainName}{items.length>1?` 外 ${items.length-1} 項`:""}
                </div>
              </div>

              {isCancelled
                ?<div style={{padding:"14px 18px",background:C.redBg}}><div style={{fontSize:12,color:C.red}}>此訂單已取消</div></div>
                :<div style={{padding:"16px 18px"}}>
                  {/* 整筆訂單出貨進度條 */}
                  <div style={{marginBottom:16}}>
                    <div style={{display:"flex",alignItems:"flex-start"}}>
                      {STEPS.map((s,si)=>{
                        const done=si<curIdx,active=si===curIdx;
                        return(
                          <div key={s.key} style={{display:"flex",alignItems:"center",flex:si<STEPS.length-1?1:0}}>
                            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                              <div style={{width:active?18:12,height:active?18:12,borderRadius:"50%",background:done?C.accent:active?C.bgDark:C.borderLight,border:`1.5px solid ${done||active?C.accent:C.borderLight}`,flexShrink:0,boxShadow:active?`0 2px 8px ${C.accent}40`:"none",transition:"all .3s",display:"flex",alignItems:"center",justifyContent:"center"}}>
                                {done&&<div style={{width:5,height:5,borderRadius:"50%",background:"#fff"}}/>}
                                {active&&<div style={{width:6,height:6,borderRadius:"50%",background:"#fff"}}/>}
                              </div>
                              <div style={{fontSize:9,color:active?C.accent:done?C.accentLight:C.faint,fontWeight:active?600:400,whiteSpace:"nowrap",letterSpacing:.2}}>{s.label}</div>
                            </div>
                            {si<STEPS.length-1&&<div style={{flex:1,height:1.5,background:done?C.accent:C.borderLight,margin:"0 3px",marginBottom:14,borderRadius:99,transition:"background .4s"}}/>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 品項明細 */}
                  <div style={{borderTop:`1px solid ${C.borderLight}`,paddingTop:12,display:"flex",flexDirection:"column",gap:8}}>
                    {items.map((it,idx)=>(
                      <div key={idx} style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:36,height:36,borderRadius:8,background:C.bgDeep,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,overflow:"hidden"}}>
                          {isImgSrc(it.image)?<img src={it.image} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>:it.image||"🛒"}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          {(()=>{const {mainName,variants}=parseItemName(it.name);return(<>
                            <div style={{fontSize:13,fontWeight:500,color:C.text}}>{mainName}</div>
                            {variants.map((v,vi)=>(
                              <div key={vi} style={{fontSize:11,color:C.muted,marginTop:1}}>
                                {v.label&&<span style={{color:C.faint,marginRight:3}}>{v.label}</span>}{v.value}
                              </div>
                            ))}
                          </>)})()}
                        </div>
                        <div style={{fontSize:12,color:C.muted,whiteSpace:"nowrap"}}>×{it.qty}</div>
                        {it.price>0&&<div style={{fontSize:13,fontWeight:600,color:C.text,whiteSpace:"nowrap"}}>{fmtMoney(it.price*it.qty)}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              }

              {/* Footer */}
              <div style={{padding:"12px 18px",borderTop:`1px solid ${C.borderLight}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:C.bgDeep}}>
                <div style={{fontSize:11,color:C.muted}}>{items.length} 項商品</div>
                <div style={{fontSize:15,fontWeight:700,color:C.text}}>{fmtMoney(o.total)}</div>
              </div>
            </Card>
          );
        })
      }
    </div>
  );
}
