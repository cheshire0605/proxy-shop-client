import { useState, useEffect } from "react";
import { C } from "../theme";
import { Card, Btn, Field, Sheet, HR } from "../components/ui";
import { AnnouncementBar } from "../components/AnnouncementBar";
import { fmtMoney, sanitize, safePrice, safeQty, secureUid, parseItemName, isImgSrc } from "../utils";

// ─── 商品詳情（單一 SKU；variant.stock=null 代購無限、數字現貨庫存）──────
function ProductSheet({product,onAdd,onClose}){
  const variants=(product.variants||[]).filter(v=>v.status!=="off");
  const [selId,setSelId]=useState(variants.length===1?variants[0].id:null);
  const [qty,setQty]=useState(1);
  if(!product)return null;
  const isStock=product.type==="stock";
  const sel=variants.find(v=>v.id===selId);
  const selStock=sel&&sel.stock!=null?Number(sel.stock):null;    // null=無限(代購)
  const maxQty=selStock==null?99:Math.max(0,selStock);
  const q=Math.min(qty,Math.max(1,maxQty));
  const prices=variants.map(v=>Number(v.price)||0).filter(x=>x>0);
  const minP=prices.length?Math.min(...prices):0, maxP=prices.length?Math.max(...prices):0;
  const hasRange=prices.length>1&&maxP>minP;
  const showVariants=variants.length>1 || (variants[0]&&variants[0].spec);
  const dispPrice=sel?(Number(sel.price)||0):minP;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <div style={{background:C.bgDeep,aspectRatio:"4/3",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:18,overflow:"hidden",margin:"0 -22px"}}>
        {isImgSrc(product.image)?<img src={product.image} alt={product.name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>:<span style={{fontSize:72}}>{product.image||"🛒"}</span>}
      </div>
      <div>
        <div style={{fontSize:11,color:isStock?C.green:C.muted,letterSpacing:.5,marginBottom:4,fontWeight:isStock?600:400}}>{isStock?"現貨":sanitize(product.category?.name||"")}</div>
        <div style={{fontSize:20,fontWeight:600,color:C.text}}>{sanitize(product.name)}</div>
      </div>
      {dispPrice>0?(
        <div style={{background:C.accentBg,borderRadius:C.rSm,padding:"16px 18px"}}>
          <div style={{fontSize:24,fontWeight:700,color:C.accent}}>{sel||!hasRange?fmtMoney(dispPrice):`$${minP} - $${maxP}`}</div>
          {!isStock&&<div style={{fontSize:11,color:C.muted,marginTop:4}}>實際金額以業者確認為準</div>}
        </div>
      ):(
        <div style={{background:C.accentBg,borderRadius:C.rSm,padding:"16px 18px"}}><div style={{fontSize:14,color:C.muted}}>價格洽詢</div></div>
      )}
      {showVariants&&(
        <div>
          <div style={{fontSize:13,fontWeight:500,marginBottom:8,color:C.textMid}}>規格</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {variants.map(v=>{
              const so=v.stock!=null&&Number(v.stock)<=0, on=selId===v.id;
              return(
                <button key={v.id} disabled={so} onClick={()=>{setSelId(v.id);setQty(1);}}
                  style={{padding:"8px 14px",borderRadius:99,fontSize:13,cursor:so?"not-allowed":"pointer",opacity:so?.45:1,border:`1.5px solid ${on?C.accent:C.border}`,background:on?C.accentBg:"transparent",color:on?C.accent:C.textMid,fontWeight:on?500:400}}>
                  {v.spec||"標準"}{v.price>0?` $${v.price}`:""}{v.stock!=null?` · ${so?"售完":`剩 ${v.stock}`}`:""}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div>
        <div style={{fontSize:13,fontWeight:500,marginBottom:12,color:C.textMid}}>數量 {sel&&selStock!=null&&<span style={{color:C.faint,fontSize:11}}>（剩 {maxQty}）</span>}</div>
        <div style={{display:"flex",alignItems:"center",gap:20}}>
          <button onClick={()=>setQty(x=>Math.max(1,x-1))} style={{width:40,height:40,borderRadius:"50%",background:C.bgDeep,border:`1px solid ${C.border}`,fontSize:20,cursor:"pointer"}}>−</button>
          <div style={{fontSize:20,fontWeight:600,minWidth:32,textAlign:"center"}}>{q}</div>
          <button onClick={()=>setQty(x=>Math.min(maxQty,x+1))} disabled={q>=maxQty} style={{width:40,height:40,borderRadius:"50%",background:C.bgDeep,border:`1px solid ${C.border}`,fontSize:20,cursor:q>=maxQty?"not-allowed":"pointer",opacity:q>=maxQty?.45:1}}>+</button>
          {dispPrice>0&&<div style={{marginLeft:"auto",fontSize:12,color:C.muted}}>小計 <span style={{color:C.accent,fontWeight:600,fontSize:14}}>{fmtMoney(dispPrice*q)}</span></div>}
        </div>
      </div>
      <Btn full disabled={!sel||maxQty<=0} onClick={()=>{
        if(!sel||maxQty<=0)return;
        const n=Math.min(q,maxQty);
        const ci={id:`v_${sel.id}`,name:`${sanitize(product.name)}${sel.spec?` / ${sel.spec}`:""}`,product_name:sanitize(product.name),spec:sel.spec||"",price:safePrice(sel.price),image:product.image||"",variant_id:sel.id,category:isStock?"現貨":sanitize(product.category?.name||"")};
        for(let i=0;i<n;i++)onAdd(ci);
        onClose();
      }}>{!sel?"請選擇規格":maxQty<=0?"售完":"加入購物車"}</Btn>
    </div>
  );
}

// ─── 商品卡片 ─────────────────────────────────────────────────────
function ProductCard({p,idx,qtyInCart,onOpen}){
  const isStock=p.type==="stock";
  const variants=p.variants||[];
  const prices=variants.map(v=>Number(v.price)||0).filter(x=>x>0);
  const minPrice=prices.length?Math.min(...prices):0;
  const hasMultiple=prices.length>1&&Math.max(...prices)>minPrice;
  const soldOut=isStock&&variants.length>0&&variants.every(v=>v.stock!=null&&Number(v.stock)<=0);
  return(
    <div className="fadeUp" style={{animationDelay:`${idx*.03}s`,background:C.bgCard,borderRadius:16,overflow:"hidden",cursor:"pointer",border:`1px solid ${C.borderLight}`,boxShadow:C.shadow,opacity:soldOut?.6:1}} onClick={onOpen}>
      <div style={{background:C.bgDeep,aspectRatio:"1/1",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
        {isImgSrc(p.image)?<img src={p.image} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>:<span style={{fontSize:36}}>{p.image||"🛒"}</span>}
        {isStock&&<span style={{position:"absolute",top:8,left:8,background:soldOut?C.muted:C.green,color:"#fff",fontSize:9,padding:"2px 7px",borderRadius:99,fontWeight:600,letterSpacing:.3}}>{soldOut?"售完":"現貨"}</span>}
        {qtyInCart&&<span style={{position:"absolute",top:8,right:8,background:C.accent,color:"#fff",fontSize:10,width:20,height:20,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{qtyInCart}</span>}
      </div>
      <div style={{padding:"10px 12px 12px"}}>
        <div style={{fontSize:10,color:C.faint,marginBottom:3,letterSpacing:.3}}>{sanitize(p.category?.name||"")}</div>
        <div style={{fontSize:12,lineHeight:1.4,color:C.text,marginBottom:5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{sanitize(p.name)}</div>
        {minPrice>0?<div style={{fontSize:13,fontWeight:600,color:C.accent}}>{hasMultiple?`$${minPrice} - $${Math.max(...prices)}`:fmtMoney(minPrice)}</div>:<div style={{fontSize:11,color:C.faint}}>洽詢定價</div>}
      </div>
    </div>
  );
}

export function CatalogTab({products,categories,cart,onAdd,showCart,setShowCart,updateCartQty,removeFromCart,submitOrder,announcements,member}){
  const [activeCat,setActiveCat]=useState("all");
  const [search,setSearch]=useState("");
  const [selected,setSelected]=useState(null);
  const [showManual,setShowManual]=useState(false);
  const [mName,setMName]=useState("");
  const [mPrice,setMPrice]=useState("");
  const [payAmount,setPayAmount]=useState("");
  const [payLast5,setPayLast5]=useState("");
  const [payErr,setPayErr]=useState("");
  // 收件資訊（預帶會員資料，可針對這張訂單修改）
  const [ship,setShip]=useState({recipient_name:"",recipient_phone:"",recipient_store:""});
  useEffect(()=>{
    if(!member)return;
    setShip(s=>({
      recipient_name:  s.recipient_name  || member.recipient_name || "",
      recipient_phone: s.recipient_phone || member.phone          || "",
      recipient_store: s.recipient_store || member.seven_store     || "",
    }));
  },[member]);

  const doSubmit=()=>{
    setPayErr("");
    if(!ship.recipient_name.trim()){ setPayErr("請填收件人姓名"); return; }
    if(!/^09\d{8}$/.test(ship.recipient_phone.trim())){ setPayErr("收件電話須為 09 開頭、共 10 碼"); return; }
    if(!ship.recipient_store.trim()){ setPayErr("請填 7-11 取件門市"); return; }
    const amt=Number(payAmount)||0;
    const last5=payLast5||"";
    if(amt>0 && last5.length!==5){ setPayErr("請填寫匯款帳號後 5 碼"); return; }
    if(last5 && amt<=0){ setPayErr("請填寫匯款金額"); return; }
    submitOrder({ payAmount: amt, payLast5: last5, ship });
    setPayAmount(""); setPayLast5(""); setPayErr("");
  };

  // 匯款金額與末5碼：要嘛都填、要嘛都空；只填一個 → 另一個顯示錯誤
  const amtFilled = payAmount !== "";
  const last5Filled = payLast5.length > 0;
  const amtErr = (payAmount!=="" && Number(payAmount)<=0) ? "金額須大於 0"
               : (!amtFilled && last5Filled) ? "請填寫匯款金額" : "";
  const last5Err = (payLast5.length>0 && payLast5.length<5) ? "請填完整 5 碼"
                 : (payLast5.length===0 && amtFilled) ? "請填寫匯款帳號末 5 碼" : "";

  const inCart=id=>cart.find(c=>c.id===id);
  const active=(products||[]).filter(p=>p.status==="on");
  const catMatch=p=>activeCat==="all"||p.category_id===activeCat;
  const searchMatch=p=>!search||sanitize(p.name).includes(search)||sanitize(p.category?.name||"").includes(search);
  const stockItems=active.filter(p=>p.type==="stock"&&catMatch(p)&&searchMatch(p));
  const proxyItems=active.filter(p=>p.type!=="stock"&&catMatch(p)&&searchMatch(p));
  const cats=[{id:"all",name:"全部"},...(categories||[])];

  return(
    <div style={{padding:"16px 16px 100px",display:"flex",flexDirection:"column",gap:16}}>
      {/* 公告 */}
      <AnnouncementBar announcements={announcements}/>

      {/* 搜尋 */}
      <div style={{position:"relative"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜尋商品..."
          style={{width:"100%",background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:99,padding:"11px 16px 11px 42px",fontSize:13,color:C.text,boxShadow:C.shadow}}
          onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
        <span style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",color:C.faint,fontSize:16}}>🔍</span>
        {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.faint,fontSize:18,cursor:"pointer"}}>×</button>}
      </div>

      {/* 分類 */}
      <div style={{display:"flex",gap:8,overflowX:"auto",scrollbarWidth:"none",paddingBottom:2}}>
        {cats.map(cat=>(
          <button key={cat.id} onClick={()=>setActiveCat(cat.id)} style={{padding:"7px 16px",borderRadius:99,fontSize:12,cursor:"pointer",whiteSpace:"nowrap",transition:"all .15s",border:`1.5px solid ${activeCat===cat.id?C.accent:C.border}`,background:activeCat===cat.id?C.accentBg:"transparent",color:activeCat===cat.id?C.accent:C.muted,fontWeight:activeCat===cat.id?500:400}}>
            {cat.name}
          </button>
        ))}
      </div>

      {/* 現貨 */}
      {stockItems.length>0&&(
        <div>
          <div style={{fontSize:12,color:C.muted,letterSpacing:.5,marginBottom:10,fontWeight:500}}>— 現貨商品 —</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            {stockItems.map((p,i)=><ProductCard key={p.id} p={p} idx={i} qtyInCart={inCart(`v_${(p.variants&&p.variants[0]||{}).id}`)?.qty} onOpen={()=>setSelected(p)}/>)}
          </div>
        </div>
      )}

      {/* 代購 */}
      <div>
        <div style={{fontSize:12,color:C.muted,letterSpacing:.5,marginBottom:10,fontWeight:500}}>— 代購 —</div>
        {proxyItems.length===0
          ?<div style={{textAlign:"center",padding:"40px 0",color:C.faint,fontSize:13}}>找不到商品</div>
          :<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            {proxyItems.map((p,i)=><ProductCard key={p.id} p={p} idx={i} onOpen={()=>setSelected(p)}/>)}
          </div>
        }
      </div>

      {/* 手動輸入 */}
      <Card style={{padding:"16px"}}>
        <div style={{fontSize:12,color:C.muted,marginBottom:10}}>找不到商品？手動填寫</div>
        {!showManual
          ?<button onClick={()=>setShowManual(true)} style={{background:C.bgDeep,border:`1px solid ${C.border}`,borderRadius:99,padding:"8px 20px",fontSize:12,color:C.textMid,cursor:"pointer"}}>+ 手動輸入</button>
          :<div style={{display:"flex",flexDirection:"column",gap:10}}>
            <Field label="商品名稱 *" value={mName} onChange={v=>setMName(v.slice(0,100))} placeholder="商品名稱、規格、顏色…"/>
            <Field label="金額（NT$）" type="number" value={mPrice} onChange={setMPrice} placeholder="0"/>
            <div style={{display:"flex",gap:8}}>
              <Btn full onClick={()=>{const n=sanitize(mName,100);if(!n)return;onAdd({id:secureUid(),name:n,price:safePrice(mPrice),image:"",category:"手動輸入"});setShowManual(false);setMName("");setMPrice("");}}>加入購物車</Btn>
              <Btn variant="outline" sm onClick={()=>setShowManual(false)}>取消</Btn>
            </div>
          </div>
        }
      </Card>

      {/* 商品詳情 Sheet */}
      <Sheet open={!!selected} onClose={()=>setSelected(null)} title={selected?sanitize(selected.name):""}>
        {selected&&<ProductSheet product={selected} onAdd={onAdd} onClose={()=>setSelected(null)}/>}
      </Sheet>

      {/* 購物車 Sheet */}
      <Sheet open={showCart} onClose={()=>setShowCart(false)} title="購物車">
        <div style={{display:"flex",flexDirection:"column"}}>
          {cart.length===0
            ?<div style={{textAlign:"center",padding:"40px 0",color:C.faint}}>購物車是空的</div>
            :<>
              {cart.map((item,i)=>(
                <div key={item.id}>
                  <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 0"}}>
                    <div style={{width:48,height:48,background:C.bgDeep,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,overflow:"hidden"}}>
                      {isImgSrc(item.image)
                        ?<img src={item.image} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>
                        :item.image||"🛒"}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      {(()=>{const {mainName,variants}=parseItemName(item.name);return(<>
                        <div style={{fontSize:13,fontWeight:500,color:C.text}}>{mainName}</div>
                        {variants.map((v,vi)=>(
                          <div key={vi} style={{fontSize:11,color:C.muted,marginTop:1}}>
                            {v.label&&<span style={{color:C.faint,marginRight:3}}>{v.label}</span>}{v.value}
                          </div>
                        ))}
                        <div style={{fontSize:12,color:C.accent,marginTop:2}}>{item.price>0?fmtMoney(item.price):"洽詢"} × {item.qty}</div>
                      </>)})()}
                    </div>
                    <div style={{display:"flex",alignItems:"center",flexShrink:0}}>
                      <button onClick={()=>updateCartQty(item.id,-1)} style={{width:28,height:28,border:`1px solid ${C.border}`,borderRadius:"8px 0 0 8px",background:C.bgDeep,color:C.textMid,fontSize:16,cursor:"pointer"}}>−</button>
                      <div style={{width:32,textAlign:"center",fontSize:13,border:`1px solid ${C.border}`,borderLeft:"none",borderRight:"none",height:28,lineHeight:"28px"}}>{item.qty}</div>
                      <button onClick={()=>updateCartQty(item.id,1)} style={{width:28,height:28,border:`1px solid ${C.border}`,borderRadius:"0 8px 8px 0",background:C.bgDeep,color:C.textMid,fontSize:16,cursor:"pointer"}}>+</button>
                    </div>
                    <button onClick={()=>removeFromCart(item.id)} style={{background:"none",border:"none",color:C.faint,fontSize:20,cursor:"pointer"}}>×</button>
                  </div>
                  {i<cart.length-1&&<HR/>}
                </div>
              ))}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 0",borderTop:`1px solid ${C.border}`,marginTop:8}}>
                <div style={{fontSize:13,color:C.muted}}>{cart.length} 項商品</div>
                <div style={{fontSize:20,fontWeight:700,color:C.text}}>{fmtMoney(cart.reduce((s,c)=>s+safePrice(c.price)*safeQty(c.qty),0))}</div>
              </div>

              {/* 收件資訊（預帶會員資料，可修改此單） */}
              <div style={{background:C.bgDeep,borderRadius:C.rSm,padding:"14px 16px",marginBottom:12,border:`1px solid ${C.border}`}}>
                <div style={{fontSize:11,color:C.muted,marginBottom:10,letterSpacing:.5,fontWeight:600}}>📦 收件資訊（可修改此單）</div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {[
                    {key:"recipient_name",label:"收件人姓名",ph:"取件姓名"},
                    {key:"recipient_phone",label:"收件電話",ph:"09xxxxxxxx",check:v=>v&&!/^09\d{8}$/.test(v)?"電話須為 09 開頭、共 10 碼":""},
                    {key:"recipient_store",label:"7-11 門市",ph:"取件門市（賣貨便）"},
                  ].map(f=>{
                    const err=f.check?f.check(ship[f.key].trim()):"";
                    return(
                    <div key={f.key}>
                      <label style={{fontSize:11,color:C.textMid,display:"block",marginBottom:4}}>{f.label}</label>
                      <input value={ship[f.key]} onChange={e=>setShip(s=>({...s,[f.key]:e.target.value}))} placeholder={f.ph}
                        style={{width:"100%",padding:"9px 12px",border:`1px solid ${err?C.red:C.border}`,borderRadius:8,fontSize:14,boxSizing:"border-box",background:"#fff",color:C.text}}/>
                      {err&&<div style={{fontSize:11,color:C.red,marginTop:3}}>{err}</div>}
                    </div>
                    );
                  })}
                  <div style={{fontSize:10,color:C.faint,lineHeight:1.6,padding:"4px 2px"}}>已自動帶入你的會員資料，可針對這張訂單修改</div>
                </div>
              </div>

              {/* 付款資訊輸入 */}
              <div style={{background:C.bgDeep,borderRadius:C.rSm,padding:"14px 16px",marginBottom:12,border:`1px solid ${C.border}`}}>
                <div style={{fontSize:11,color:C.muted,marginBottom:10,letterSpacing:.5,fontWeight:600}}>💰 匯款資訊(訂金或全額)</div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <div>
                    <label style={{fontSize:11,color:C.textMid,display:"block",marginBottom:4}}>匯款金額 NT$</label>
                    <input type="number" inputMode="numeric" value={payAmount} onChange={e=>setPayAmount(e.target.value)}
                      onWheel={e=>e.currentTarget.blur()}
                      placeholder="例如:500"
                      style={{width:"100%",padding:"9px 12px",border:`1px solid ${amtErr?C.red:C.border}`,borderRadius:8,fontSize:14,boxSizing:"border-box",background:"#fff",color:C.text}}/>
                    {amtErr&&<div style={{fontSize:11,color:C.red,marginTop:3}}>{amtErr}</div>}
                  </div>
                  <div>
                    <label style={{fontSize:11,color:C.textMid,display:"block",marginBottom:4}}>匯款帳號末 5 碼</label>
                    <input type="text" inputMode="numeric" maxLength={5} value={payLast5} onChange={e=>setPayLast5(e.target.value.replace(/\D/g,"").slice(0,5))}
                      placeholder="例如:12345"
                      style={{width:"100%",padding:"9px 12px",border:`1px solid ${last5Err?C.red:C.border}`,borderRadius:8,fontSize:14,boxSizing:"border-box",background:"#fff",color:C.text,letterSpacing:2}}/>
                    {last5Err&&<div style={{fontSize:11,color:C.red,marginTop:3}}>{last5Err}</div>}
                  </div>
                  <div style={{fontSize:10,color:C.faint,lineHeight:1.6,padding:"4px 2px"}}>
                    填寫後業者較快核對,可先匯訂金或不填(送出後再補)
                  </div>
                </div>
              </div>

              {payErr&&<div style={{fontSize:12,color:C.red,background:C.redBg,padding:"8px 12px",borderRadius:C.rSm,marginBottom:10}}>{payErr}</div>}
              <Btn full onClick={doSubmit}>確認送出訂單</Btn>
              <div style={{fontSize:11,color:C.faint,textAlign:"center",marginTop:12,lineHeight:1.8}}>送出後業者確認並與您聯繫<br/>代購最終價格以業者報價為準</div>
            </>
          }
        </div>
      </Sheet>
    </div>
  );
}
