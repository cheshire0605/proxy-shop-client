import { useState, useEffect } from "react";
import { C } from "../theme";
import { Card, Btn, Field, Sheet, HR } from "../components/ui";
import { AnnouncementBar } from "../components/AnnouncementBar";
import { fmtMoney, sanitize, safePrice, safeQty, secureUid, parseItemName, isImgSrc, formatShortDate } from "../utils";
import { TW_BANKS } from "../constants";

// 現貨可賣量＝在手(stock)−已預約(reserved)；代購 stock=null 視為無限
const availOf = v => v && v.stock!=null ? Math.max(0, Number(v.stock)-(Number(v.reserved)||0)) : null;

// ─── 商品詳情（單一 SKU；variant.stock=null 代購無限、數字現貨庫存）──────
function ProductSheet({product,onAdd,onClose}){
  const variants=(product.variants||[]).filter(v=>v.status!=="off");
  const [selId,setSelId]=useState(variants.length===1?variants[0].id:null);
  const [qty,setQty]=useState(1);
  if(!product)return null;
  const isStock=product.type==="stock";
  const sel=variants.find(v=>v.id===selId);
  const payType=isStock?"full":(product.payment_type||"full");   // 現貨一律全額
  const selDeposit=sel?Number(sel.deposit_amount)||0:0;
  const selStock=availOf(sel);                                   // 可賣量；null=無限(代購)
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
        {isImgSrc(product.image)?<img src={product.image} alt={product.name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>:<span style={{fontSize:14,color:C.faint,letterSpacing:.5}}>no image</span>}
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
      {/* 付款方式提示（代購才有訂金/貨到；現貨一律全額不顯示） */}
      {payType==="deposit"&&(selDeposit>0
        ?<div style={{fontSize:12,color:C.accent,fontWeight:500}}>訂金 NT$ {selDeposit}<span style={{color:C.muted,fontWeight:400,marginLeft:6}}>尾款 NT$ {Math.max(0,(dispPrice||0)-selDeposit)} 取貨時付</span></div>
        :<div style={{fontSize:12,color:C.muted}}>💰 先付訂金 · 請選擇款式查看訂金金額</div>
      )}
      {payType==="cod"&&<div style={{fontSize:12,color:C.accent,fontWeight:500}}>💰 貨到付款</div>}
      {/* 結單日期 / 預計到貨 */}
      {(product.deadline||product.expected_arrival)&&(
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {product.deadline&&(
            <div style={{flex:1,minWidth:130,background:C.bgDeep,borderRadius:C.rSm,padding:"10px 12px",border:`1px solid ${C.borderLight}`}}>
              <div style={{fontSize:10,color:C.faint,letterSpacing:.5,marginBottom:3,fontWeight:600}}>⏰ 結單日期</div>
              <div style={{fontSize:13,color:C.text,fontWeight:500}}>{formatShortDate(product.deadline)}</div>
            </div>
          )}
          {product.expected_arrival&&(
            <div style={{flex:1,minWidth:130,background:C.bgDeep,borderRadius:C.rSm,padding:"10px 12px",border:`1px solid ${C.borderLight}`}}>
              <div style={{fontSize:10,color:C.faint,letterSpacing:.5,marginBottom:3,fontWeight:600}}>📦 預計到貨</div>
              <div style={{fontSize:13,color:C.text,fontWeight:500}}>{formatShortDate(product.expected_arrival)}</div>
            </div>
          )}
        </div>
      )}
      {showVariants&&(
        <div>
          <div style={{fontSize:13,fontWeight:500,marginBottom:8,color:C.textMid}}>規格</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {variants.map(v=>{
              const av=availOf(v), so=av!=null&&av<=0, on=selId===v.id;
              return(
                <button key={v.id} disabled={so} onClick={()=>{setSelId(v.id);setQty(1);}}
                  style={{padding:"8px 14px",borderRadius:99,fontSize:13,cursor:so?"not-allowed":"pointer",opacity:so?.45:1,border:`1.5px solid ${on?C.accent:C.border}`,background:on?C.accentBg:"transparent",color:on?C.accent:C.textMid,fontWeight:on?500:400}}>
                  {v.spec||"標準"}{v.price>0?` $${v.price}`:""}{av!=null?` · ${so?"售完":`剩 ${av}`}`:""}
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
        const ci={id:`v_${sel.id}`,name:`${sanitize(product.name)}${sel.spec?` / ${sel.spec}`:""}`,product_name:sanitize(product.name),spec:sel.spec||"",price:safePrice(sel.price),image:product.image||"",variant_id:sel.id,category:isStock?"現貨":sanitize(product.category?.name||""),payment_type:payType,deposit_amount:selDeposit,cost:Number(sel.cost)||0};
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
  const soldOut=isStock&&variants.length>0&&variants.every(v=>{const a=availOf(v);return a!=null&&a<=0;});
  return(
    <div className="fadeUp" style={{animationDelay:`${idx*.03}s`,background:C.bgCard,borderRadius:16,overflow:"hidden",cursor:"pointer",border:`1px solid ${C.borderLight}`,boxShadow:C.shadow,opacity:soldOut?.6:1}} onClick={onOpen}>
      <div style={{background:C.bgDeep,aspectRatio:"1/1",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
        {isImgSrc(p.image)?<img src={p.image} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>:<span style={{fontSize:11,color:C.faint,letterSpacing:.3}}>no image</span>}
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

// 取貨方式：門市欄的標籤/提示/是否必填依方式而定
const DELIVERY = [
  { v:"shopee",   l:"賣貨便", storeLabel:"7-11 門市", storePh:"取件門市（賣貨便）", storeReq:true  },
  { v:"meetup",   l:"面交",   storeLabel:"面交地點",  storePh:"約定地點（選填）",   storeReq:false },
  { v:"delivery", l:"宅配",   storeLabel:"宅配地址",  storePh:"完整收件地址",     storeReq:true  },
];

export function CatalogTab({products,categories,cart,onAdd,showCart,setShowCart,updateCartQty,removeFromCart,submitOrder,announcements,member,autoCancelHours=36}){
  const [activeCat,setActiveCat]=useState("all");
  const [search,setSearch]=useState("");
  const [selected,setSelected]=useState(null);
  const [showManual,setShowManual]=useState(false);
  const [mName,setMName]=useState("");
  const [mPrice,setMPrice]=useState("");
  const [payAmount,setPayAmount]=useState("");
  const [payLast5,setPayLast5]=useState("");
  const [payBank,setPayBank]=useState("");
  const [payErr,setPayErr]=useState("");
  const [step,setStep]=useState("cart");                       // 兩步式結帳：cart → info
  const [deliveryMethod,setDeliveryMethod]=useState("shopee"); // 取貨方式
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

  // 關閉購物車時回到第一步
  useEffect(()=>{ if(!showCart) setStep("cart"); },[showCart]);

  // 深連結：網址帶 ?product=ID 自動打開該商品詳情（用完清掉參數）
  useEffect(()=>{
    if(!products||products.length===0)return;
    try{
      const pid=new URLSearchParams(window.location.search).get("product");
      if(!pid)return;
      const found=products.find(p=>p.id===pid);
      if(found&&found.status==="on"){
        setSelected(found);
        const url=new URL(window.location);
        url.searchParams.delete("product");
        window.history.replaceState({},"",url);
      }
    }catch(e){ console.warn("URL params error:",e); }
  },[products]);

  const doSubmit=()=>{
    setPayErr("");
    if(!ship.recipient_name.trim()){ setPayErr("請填收件人姓名"); return; }
    if(!/^09\d{8}$/.test(ship.recipient_phone.trim())){ setPayErr("收件電話須為 09 開頭、共 10 碼"); return; }
    if(dm.storeReq && !ship.recipient_store.trim()){ setPayErr(`請填${dm.storeLabel}`); return; }
    const amt=Number(payAmount)||0;
    const last5=payLast5||"";
    // 匯款資訊改必填（銀行/金額/末5碼三者皆須填）
    if(!payBank){ setPayErr("請選擇匯款銀行"); return; }
    if(amt<=0){ setPayErr("請填寫匯款金額"); return; }
    if(last5.length!==5){ setPayErr("請填寫完整匯款帳號末 5 碼"); return; }
    submitOrder({ payAmount: amt, payLast5: last5, payBank, ship, deliveryMethod });
    setPayAmount(""); setPayLast5(""); setPayBank(""); setPayErr("");
  };

  // 匯款資訊必填：空欄用 accent 邊框提示、輸入不合法才顯示紅字
  const amtErr   = (payAmount!=="" && Number(payAmount)<=0) ? "金額須大於 0" : "";
  const last5Err = (payLast5.length>0 && payLast5.length<5) ? "請填完整 5 碼" : "";
  const bd = (err,empty) => err ? C.red : (empty ? C.accent : C.border);   // 邊框色
  const dm = DELIVERY.find(d=>d.v===deliveryMethod) || DELIVERY[0];        // 目前取貨方式

  const inCart=id=>cart.find(c=>c.id===id);
  const active=(products||[]).filter(p=>p.status==="on");
  const catMatch=p=>activeCat==="all"||p.category_id===activeCat;
  const searchMatch=p=>!search||sanitize(p.name).includes(search)||sanitize(p.category?.name||"").includes(search);
  const stockItems=active.filter(p=>p.type==="stock"&&catMatch(p)&&searchMatch(p));
  const proxyItems=active.filter(p=>p.type!=="stock"&&catMatch(p)&&searchMatch(p));
  const cats=[{id:"all",name:"全部"},...(categories||[])];

  return(
    <div style={{padding:"16px 16px 100px",display:"flex",flexDirection:"column",gap:16}}>
      {!showCart && <>
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
      </>}

      {/* 商品詳情 Sheet */}
      <Sheet open={!!selected} onClose={()=>setSelected(null)} title={selected?sanitize(selected.name):""}>
        {selected&&<ProductSheet product={selected} onAdd={onAdd} onClose={()=>setSelected(null)}/>}
      </Sheet>

      {/* 購物車整頁（取代目錄內容） */}
      {showCart && (
        <div style={{display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
            <button onClick={()=> step==="info" ? setStep("cart") : setShowCart(false)} style={{width:36,height:36,borderRadius:"50%",border:`1px solid ${C.border}`,background:C.bgCard,fontSize:18,cursor:"pointer",color:C.textMid,flexShrink:0}}>←</button>
            <h2 style={{fontSize:18,fontWeight:700,margin:0}}>{step==="info" ? "填寫結帳資訊" : "購物車"}</h2>
          </div>
          {cart.length===0
            ?<div style={{textAlign:"center",padding:"40px 0",color:C.faint}}>購物車是空的</div>
            :<>
              {step==="cart" && <>
              {cart.map((item,i)=>(
                <div key={item.id}>
                  <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 0"}}>
                    <div style={{width:48,height:48,background:C.bgDeep,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,overflow:"hidden"}}>
                      {isImgSrc(item.image)
                        ?<img src={item.image} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>
                        :<span style={{fontSize:9,color:C.faint}}>no image</span>}
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
              {/* 金額明細（依各項付款方式拆：現在應付 / 之後付） */}
              {(()=>{
                const subtotal=cart.reduce((s,c)=>s+safePrice(c.price)*safeQty(c.qty),0);
                let depositSum=0,fullPaySum=0,codSum=0,remainSum=0;
                cart.forEach(c=>{
                  const pt=c.payment_type||"full";
                  const total=safePrice(c.price)*safeQty(c.qty);
                  if(pt==="deposit"){
                    const dep=Math.min((Number(c.deposit_amount)||0)*safeQty(c.qty),total);
                    depositSum+=dep; remainSum+=Math.max(0,total-dep);
                  } else if(pt==="cod"){ codSum+=total; }
                  else { fullPaySum+=total; }
                });
                const payNow=depositSum+fullPaySum, payLater=remainSum+codSum;
                return(
                  <div style={{background:C.bgDeep,borderRadius:C.rSm,padding:"14px 16px",marginBottom:12,marginTop:8,border:`1px solid ${C.border}`}}>
                    <div style={{fontSize:11,color:C.muted,marginBottom:10,letterSpacing:.5,fontWeight:600}}>金額明細</div>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}><span style={{color:C.textMid}}>商品小計</span><span style={{color:C.text}}>{fmtMoney(subtotal)}</span></div>
                      {depositSum>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13}}><span style={{color:C.textMid}}>訂金</span><span style={{color:C.accent,fontWeight:600}}>{fmtMoney(depositSum)}</span></div>}
                      {fullPaySum>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13}}><span style={{color:C.textMid}}>全款</span><span style={{color:C.accent,fontWeight:600}}>{fmtMoney(fullPaySum)}</span></div>}
                      {remainSum>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted}}><span>尾款</span><span>{fmtMoney(remainSum)}</span></div>}
                      {codSum>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted}}><span>貨到付款</span><span>{fmtMoney(codSum)}</span></div>}
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0 0",borderTop:`1px solid ${C.border}`,marginTop:6}}><span style={{fontSize:14,fontWeight:600,color:C.text}}>應付</span><span style={{fontSize:20,fontWeight:700,color:C.accent}}>{fmtMoney(payNow)}</span></div>
                      {payLater>0&&<div style={{fontSize:10,color:C.muted,textAlign:"right",lineHeight:1.5}}>尾款 {fmtMoney(payLater)} 於商品到貨時付</div>}
                    </div>
                  </div>
                );
              })()}

              {/* 下一步：填寫結帳資訊 */}
              <Btn full onClick={()=>{ setPayErr(""); setStep("info"); }}>下一步：填寫結帳資訊 →</Btn>
              <div style={{fontSize:11,color:C.faint,textAlign:"center",marginTop:12,lineHeight:1.6}}>下一步填寫取貨方式與匯款資訊</div>
              </>}

              {step==="info" && <>
              {/* 取貨方式 */}
              <div style={{background:C.bgDeep,borderRadius:C.rSm,padding:"14px 16px",marginBottom:12,border:`1px solid ${C.border}`}}>
                <div style={{fontSize:11,color:C.muted,marginBottom:10,letterSpacing:.5,fontWeight:600}}>📦 取貨方式</div>
                <div style={{display:"flex",gap:8}}>
                  {DELIVERY.map(opt=>(
                    <button key={opt.v} onClick={()=>setDeliveryMethod(opt.v)}
                      style={{flex:1,padding:"9px 12px",borderRadius:99,border:`1.5px solid ${deliveryMethod===opt.v?C.accent:C.border}`,background:deliveryMethod===opt.v?C.accentBg:"#fff",color:deliveryMethod===opt.v?C.accent:C.textMid,fontSize:13,fontWeight:deliveryMethod===opt.v?600:400,cursor:"pointer"}}>
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* 收件資訊（預帶會員資料，可修改此單） */}
              <div style={{background:C.bgDeep,borderRadius:C.rSm,padding:"14px 16px",marginBottom:12,border:`1px solid ${C.border}`}}>
                <div style={{fontSize:11,color:C.muted,marginBottom:10,letterSpacing:.5,fontWeight:600}}>📦 收件資訊（可修改此單）</div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {[
                    {key:"recipient_name",label:"收件人姓名",ph:"取件姓名"},
                    {key:"recipient_phone",label:"收件電話",ph:"09xxxxxxxx",check:v=>v&&!/^09\d{8}$/.test(v)?"電話須為 09 開頭、共 10 碼":""},
                    {key:"recipient_store",label:dm.storeLabel,ph:dm.storePh},
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

              {/* 付款資訊輸入（必填） */}
              <div style={{background:C.bgDeep,borderRadius:C.rSm,padding:"14px 16px",marginBottom:12,border:`1px solid ${C.border}`}}>
                <div style={{fontSize:11,color:C.muted,marginBottom:10,letterSpacing:.5,fontWeight:600}}>💰 匯款資訊 <span style={{color:C.accent,fontWeight:400}}>(必填)</span></div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <div>
                    <label style={{fontSize:11,color:C.textMid,display:"block",marginBottom:4}}>付款銀行 *</label>
                    <select value={payBank} onChange={e=>setPayBank(e.target.value)}
                      style={{width:"100%",padding:"9px 12px",border:`1px solid ${bd("",!payBank)}`,borderRadius:8,fontSize:14,boxSizing:"border-box",background:"#fff",color:payBank?C.text:C.muted,cursor:"pointer"}}>
                      <option value="">請選擇銀行</option>
                      {TW_BANKS.map(b=><option key={b.code} value={`${b.code} ${b.name}`}>{b.code} {b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:11,color:C.textMid,display:"block",marginBottom:4}}>匯款金額 NT$ *</label>
                    <input type="number" inputMode="numeric" value={payAmount} onChange={e=>setPayAmount(e.target.value)}
                      onWheel={e=>e.currentTarget.blur()}
                      placeholder="例如:500"
                      style={{width:"100%",padding:"9px 12px",border:`1px solid ${bd(amtErr,payAmount==="")}`,borderRadius:8,fontSize:14,boxSizing:"border-box",background:"#fff",color:C.text}}/>
                    {amtErr&&<div style={{fontSize:11,color:C.red,marginTop:3}}>{amtErr}</div>}
                  </div>
                  <div>
                    <label style={{fontSize:11,color:C.textMid,display:"block",marginBottom:4}}>匯款帳號末 5 碼 *</label>
                    <input type="text" inputMode="numeric" maxLength={5} value={payLast5} onChange={e=>setPayLast5(e.target.value.replace(/\D/g,"").slice(0,5))}
                      placeholder="例如:12345"
                      style={{width:"100%",padding:"9px 12px",border:`1px solid ${bd(last5Err,payLast5.length===0)}`,borderRadius:8,fontSize:14,boxSizing:"border-box",background:"#fff",color:C.text,letterSpacing:2}}/>
                    {last5Err&&<div style={{fontSize:11,color:C.red,marginTop:3}}>{last5Err}</div>}
                  </div>
                  <div style={{fontSize:10,color:C.accent,lineHeight:1.6,background:C.accentBg,borderRadius:6,padding:"8px 10px"}}>
                    ⚠️ 匯款資訊為必填。下單後 {autoCancelHours} 小時內業者未確認，系統將自動取消訂單。
                  </div>
                </div>
              </div>

              {payErr&&<div style={{fontSize:12,color:C.red,background:C.redBg,padding:"8px 12px",borderRadius:C.rSm,marginBottom:10}}>{payErr}</div>}
              <Btn full onClick={doSubmit}>確認送出訂單</Btn>
              <button onClick={()=>{ setPayErr(""); setStep("cart"); }} style={{width:"100%",marginTop:10,padding:"10px",background:"none",border:"none",color:C.muted,fontSize:13,cursor:"pointer"}}>← 返回購物車</button>
              <div style={{fontSize:11,color:C.faint,textAlign:"center",marginTop:12,lineHeight:1.8}}>送出後業者確認並與您聯繫<br/>代購最終價格以業者報價為準</div>
              </>}
            </>
          }
        </div>
      )}
    </div>
  );
}
