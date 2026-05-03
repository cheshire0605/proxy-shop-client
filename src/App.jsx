import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const APP_NAME = "下單系統";

const C = {
  bg: "#f5f0eb", bgCard: "#fdfaf7", bgDeep: "#ede8e1", bgDark: "#2a2118",
  surface: "#ffffff", border: "#e2dbd2", borderMid: "#c8c0b4",
  text: "#1e1a14", textMid: "#4a4438", muted: "#8a8070", faint: "#c0b8ac",
  accent: "#8b5e3c", accentLight: "#c49a6c", accentBg: "#f5ede4",
  green: "#4a7c59", greenBg: "#edf2ee",
  amber: "#8a6d3b", amberBg: "#f5f0e8",
  red: "#7a4040", redBg: "#f5eaea",
  blue: "#3a5470", blueBg: "#e8edf2",
  purple: "#5a4870", purpleBg: "#eeeaf2",
  shadow: "0 2px 12px rgba(30,26,20,0.08)",
  shadowMd: "0 4px 24px rgba(30,26,20,0.12)",
};

const ORDER_STATUS = {
  pending_review: { label:"審核中", color:C.blue, bg:C.blueBg },
  pending:        { label:"待採購", color:C.amber, bg:C.amberBg },
  bought:         { label:"已採購", color:C.green, bg:C.greenBg },
  shipped:        { label:"已寄出", color:C.purple, bg:C.purpleBg },
  arrived:        { label:"已到台", color:C.accent, bg:C.accentBg },
  cancelled:      { label:"已取消", color:C.red, bg:C.redBg },
};

const secureUid = () => { const a=new Uint8Array(9); crypto.getRandomValues(a); return Array.from(a,b=>b.toString(36).padStart(2,"0")).join("").slice(0,12); };
const sanitize = (s,max=200) => String(s??"").replace(/<[^>]*>/g,"").replace(/[<>"'`\\]/g,"").replace(/javascript:/gi,"").trim().slice(0,max);
const safeQty = n => { const v=parseInt(n,10); return Number.isFinite(v)&&v>=1&&v<=99?v:1; };
const safePrice = n => { const v=Number(n); return Number.isFinite(v)&&v>=0?Math.round(v*100)/100:0; };
const secureOrderNo = () => { const a=new Uint32Array(1); crypto.getRandomValues(a); return String(100000+(a[0]%900000)); };
const fmtMoney = n => `NT$ ${Number(n||0).toLocaleString()}`;

const INIT_DATA = {
  rate: 1,
  products: [
    { id:"p1", name:"高島屋土產代購", price:0, image:"🏯", status:"on", category:"土產" },
    { id:"p2", name:"無印良品代購",   price:0, image:"🛍", status:"on", category:"生活" },
    { id:"p3", name:"藥妝代購",       price:0, image:"💊", status:"on", category:"藥妝" },
    { id:"p4", name:"7-11代購",       price:0, image:"🏪", status:"on", category:"便利商店" },
    { id:"p5", name:"吉伊卡哇扭蛋",  price:0, image:"🎪", status:"on", category:"玩具" },
  ],
  inStock: [
    { id:"s1", name:"Hello Kitty 扭蛋 草莓款", price:350, image:"🎀", status:"on" },
    { id:"s2", name:"Sanrio 扭蛋 新款",         price:280, image:"⭐", status:"on" },
  ],
  orders: [], wishlist: [], announcements: [],
};

const injectStyles = () => {
  if (document.getElementById("tb-styles")) return;
  const s = document.createElement("style");
  s.id = "tb-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;600&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:${C.bg};color:${C.text};font-family:'Noto Sans TC',sans-serif;min-height:100vh;-webkit-font-smoothing:antialiased}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${C.faint};border-radius:99px}
    input,select,textarea,button{font-family:'Noto Sans TC',sans-serif;outline:none}
    .appear{animation:appear .3s cubic-bezier(.16,1,.3,1) both}
    @keyframes appear{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
    input[type=number]{-moz-appearance:textfield}
    input::-webkit-inner-spin-button,input::-webkit-outer-spin-button{-webkit-appearance:none}
    .tab-btn{padding:8px 18px;border-radius:99px;border:1.5px solid ${C.border};background:${C.surface};color:${C.muted};font-size:13px;cursor:pointer;transition:all .15s;white-space:nowrap;font-weight:400}
    .tab-btn.on{background:${C.accentBg};color:${C.accent};border-color:${C.accent}60;font-weight:500}
    .tab-btn.logout{color:${C.accent};border-color:${C.accent}40}
  `;
  document.head.appendChild(s);
};

const HR = ({style:sx}) => <div style={{height:1,background:C.border,...sx}}/>;

const Card = ({children,style:sx,className}) => (
  <div className={className} style={{background:C.bgCard,borderRadius:20,padding:"24px 20px",boxShadow:C.shadow,border:`1px solid ${C.border}`,...sx}}>
    {children}
  </div>
);

const Btn = ({children,onClick,variant="accent",sm,full,style:sx,disabled}) => {
  const vars = {
    accent:{background:C.accent,color:"#fff",border:"none"},
    outline:{background:"transparent",color:C.text,border:`1.5px solid ${C.border}`},
    ghost:{background:"transparent",color:C.muted,border:"none"},
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,padding:sm?"7px 16px":"12px 22px",fontSize:sm?12:14,fontWeight:500,borderRadius:99,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.45:1,transition:"opacity .15s",width:full?"100%":undefined,...vars[variant],...sx}}
      onMouseEnter={e=>{if(!disabled)e.currentTarget.style.opacity=".75";}}
      onMouseLeave={e=>{e.currentTarget.style.opacity=disabled?".45":"1";}}
    >{children}</button>
  );
};

const Field = ({label,value,onChange,type="text",placeholder,readOnly,style:sx}) => (
  <div style={{display:"flex",flexDirection:"column",gap:6,...sx}}>
    {label&&<label style={{fontSize:12,color:C.muted,fontWeight:500}}>{label}</label>}
    <input type={type} value={value??""} onChange={e=>onChange?.(e.target.value)} placeholder={placeholder} readOnly={readOnly}
      style={{background:readOnly?C.bgDeep:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"11px 14px",color:readOnly?C.muted:C.text,fontSize:14,transition:"border .15s"}}
      onFocus={e=>{if(!readOnly){e.target.style.borderColor=C.accent;e.target.style.boxShadow=`0 0 0 3px ${C.accent}18`;}}}
      onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow="none";}}
    />
  </div>
);

const StatusTag = ({status}) => {
  const s = ORDER_STATUS[status]||ORDER_STATUS.pending;
  return <span style={{fontSize:11,color:s.color,background:s.bg,padding:"4px 12px",borderRadius:99,fontWeight:500,whiteSpace:"nowrap"}}>{s.label}</span>;
};

const Toast = ({msg,onDone}) => {
  useState(()=>{const t=setTimeout(onDone,2200);return()=>clearTimeout(t);});
  return <div style={{position:"fixed",bottom:32,left:"50%",transform:"translateX(-50%)",background:C.bgDark,color:"#f5f0eb",padding:"11px 24px",borderRadius:99,fontSize:13,fontWeight:500,boxShadow:C.shadowMd,zIndex:2000,whiteSpace:"nowrap",animation:"appear .2s ease"}}>{msg}</div>;
};

const Sheet = ({open,onClose,title,children}) => {
  if(!open) return null;
  return (
    <div style={{position:"fixed",inset:0,zIndex:500}}>
      <div style={{position:"absolute",inset:0,background:"rgba(30,26,20,.5)",backdropFilter:"blur(4px)"}} onClick={onClose}/>
      <div className="appear" style={{position:"absolute",bottom:0,left:0,right:0,background:C.surface,maxHeight:"90vh",overflow:"auto",borderRadius:"24px 24px 0 0",boxShadow:C.shadowMd}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 20px 16px",borderBottom:`1px solid ${C.border}`}}>
          <span style={{fontSize:16,fontWeight:600,color:C.text}}>{title}</span>
          <button onClick={onClose} style={{background:C.bgDeep,border:"none",borderRadius:"50%",width:30,height:30,cursor:"pointer",fontSize:18,color:C.muted,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{padding:"20px 20px 48px"}}>{children}</div>
      </div>
    </div>
  );
};

function HeaderCard({subtitle,title,description,tab,setTab,onLogout}) {
  const TABS = [{id:"profile",label:"資料"},{id:"catalog",label:"商品"},{id:"wishlist",label:"許願"},{id:"orders",label:"訂單"},{id:"shipments",label:"出貨"}];
  return (
    <Card style={{margin:"16px 16px 0",borderRadius:24}}>
      <div style={{fontSize:11,color:C.muted,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>{subtitle}</div>
      <div style={{fontSize:26,fontWeight:700,color:C.text,marginBottom:6}}>{title}</div>
      {description&&<div style={{fontSize:13,color:C.muted,lineHeight:1.7,marginBottom:16}}>{description}</div>}
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {TABS.map(t=><button key={t.id} className={`tab-btn${tab===t.id?" on":""}`} onClick={()=>setTab(t.id)}>{t.label}</button>)}
        <button className="tab-btn logout" onClick={onLogout}>登出</button>
      </div>
    </Card>
  );
}

function LineLogin({onSuccess}) {
  const [status,setStatus] = useState("loading");
  const [errorMsg,setErrorMsg] = useState("");
  useEffect(()=>{
    const liffId = import.meta.env.VITE_LIFF_ID;
    if(!liffId){setStatus("error");setErrorMsg("未設定 LIFF ID");return;}
    liff.init({liffId})
      .then(()=>{if(!liff.isLoggedIn()){liff.login();return;}return liff.getProfile();})
      .then(profile=>{if(!profile)return;onSuccess({name:sanitize(profile.displayName,50)||"匿名",userId:profile.userId,pictureUrl:profile.pictureUrl});})
      .catch(()=>{setStatus("error");setErrorMsg("LINE 登入失敗，請重新整理再試");});
  },[]);
  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
      <div style={{fontSize:24,fontWeight:700,color:C.text}}>{APP_NAME}</div>
      {status==="error"
        ?<><div style={{fontSize:13,color:C.red}}>{errorMsg}</div><button onClick={()=>window.location.reload()} style={{background:C.bgDark,color:"#f5f0eb",border:"none",borderRadius:99,padding:"10px 24px",cursor:"pointer",fontSize:13}}>重新整理</button></>
        :<div style={{fontSize:28,animation:"spin 1.2s linear infinite",color:C.muted}}>◌</div>
      }
      <div style={{fontSize:13,color:C.muted}}>LINE 登入中</div>
    </div>
  );
}

function ProfileTab({member,setMember,lineUser,setToast}) {
  const [form,setForm] = useState({community_name:"",line_id:"",ig_threads:"",recipient_name:"",phone:"",seven_store:""});
  const [saving,setSaving] = useState(false);
  const [err,setErr] = useState("");

  useEffect(()=>{
    if(member?.line_user_id) setForm({community_name:member.community_name||"",line_id:member.line_id||"",ig_threads:member.ig_threads||"",recipient_name:member.recipient_name||"",phone:member.phone||"",seven_store:member.seven_store||""});
  },[member]);

  const save = async()=>{
    setErr("");setSaving(true);
    const updated={line_user_id:lineUser.userId,line_name:lineUser.name,community_name:sanitize(form.community_name,100),line_id:sanitize(form.line_id,100),ig_threads:sanitize(form.ig_threads,200),recipient_name:sanitize(form.recipient_name,50),phone:sanitize(form.phone,20),seven_store:sanitize(form.seven_store,100),updated_at:new Date().toISOString()};
    try{
      const{error}=await supabase.from("members").upsert([updated],{onConflict:"line_user_id"});
      if(error)throw error;
      setMember(updated);setToast("資料已儲存");
    }catch{setErr("儲存失敗，請稍後再試");}
    setSaving(false);
  };

  const FIELDS=[
    {key:"community_name",label:"社群名稱",placeholder:"OpenChat 顯示名稱"},
    {key:"line_id",label:"LINE ID",placeholder:"你的 LINE ID"},
    {key:"ig_threads",label:"私人 IG / FB 連結",placeholder:"https://www.instagram.com/..."},
    {key:"recipient_name",label:"收件人姓名",placeholder:"取件時的姓名"},
    {key:"phone",label:"電話",placeholder:"09xxxxxxxx"},
    {key:"seven_store",label:"7-11 門市",placeholder:"常用門市名稱"},
  ];

  return (
    <Card>
      <div style={{fontSize:16,fontWeight:600,marginBottom:4}}>基本資料</div>
      <div style={{fontSize:13,color:C.muted,marginBottom:20,lineHeight:1.6}}>LINE ID 為必填。其他資訊可以之後再補。</div>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {FIELDS.map(f=><Field key={f.key} label={f.label} placeholder={f.placeholder} value={form[f.key]} onChange={v=>setForm(p=>({...p,[f.key]:v}))}/>)}
      </div>
      {err&&<div style={{fontSize:12,color:C.red,marginTop:12}}>{err}</div>}
      <Btn full variant="accent" onClick={save} disabled={saving} style={{marginTop:20}}>{saving?"儲存中...":"儲存資料"}</Btn>
    </Card>
  );
}

function ProductDetailSheet({product,onAdd,onClose,rate}) {
  const [selVariants,setSelVariants] = useState({});
  const [qty,setQty] = useState(1);
  if(!product) return null;
  const hasVariants = product.variants&&product.variants.length>0;
  const variantGroups=(()=>{
    if(!hasVariants)return[];
    const groups={};
    product.variants.forEach(v=>{
      const parts=v.name.includes(":")?v.name.split(":"):[" 款式",v.name];
      const g=parts[0],n=parts[1]||parts[0];
      if(!groups[g])groups[g]=[];
      groups[g].push({...v,label:n});
    });
    return Object.entries(groups);
  })();
  const basePrice=product.price>0?Math.round(product.price*(rate||1)):0;
  // 計算已選款式的加價總和
  const variantExtra=Object.entries(selVariants).reduce((sum,[g,label])=>{
    const group=variantGroups.find(([gName])=>gName===g);
    const opt=group?.[1]?.find(o=>o.label===label);
    return sum+(opt?.price||0);
  },0);
  const twdPrice=basePrice>0?basePrice+Math.round(variantExtra*(rate||1)):0;
  const allSelected=variantGroups.length===0||variantGroups.every(([g])=>selVariants[g]);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{background:"#f5f0ea",aspectRatio:"4/3",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:16,overflow:"hidden",margin:"0 -20px"}}>
        {product.image?.startsWith("data:")?<img src={product.image} alt={product.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:64}}>{product.image||"🛒"}</span>}
      </div>
      <div>
        <div style={{fontSize:12,color:C.muted}}>{sanitize(product.category||"")}</div>
        <div style={{fontSize:18,fontWeight:700,color:C.text,marginTop:4}}>{sanitize(product.name)}</div>
      </div>
      {basePrice>0&&(
        <div style={{background:C.bgDeep,borderRadius:12,padding:"14px 16px"}}>
          <div style={{fontSize:22,fontWeight:700,color:C.accent}}>
            {fmtMoney(twdPrice)}
            {variantExtra>0&&<span style={{fontSize:13,color:C.muted,fontWeight:400,marginLeft:8}}>（含加價 +NT${Math.round(variantExtra*(rate||1))}）</span>}
          </div>
          <div style={{fontSize:11,color:C.muted,marginTop:2}}>此為預估金額，以業者報價為準</div>
        </div>
      )}
      {variantGroups.map(([groupName,options])=>(
        <div key={groupName}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>{groupName}</div>
          <div style={{position:"relative"}}>
            <select value={selVariants[groupName]||""} onChange={e=>setSelVariants(p=>({...p,[groupName]:e.target.value}))}
              style={{width:"100%",background:C.surface,border:`1.5px solid ${selVariants[groupName]?C.accent:C.border}`,borderRadius:12,padding:"11px 36px 11px 14px",fontSize:14,color:selVariants[groupName]?C.text:C.muted,appearance:"none",cursor:"pointer"}}>
              <option value="">請選擇{groupName}</option>
              {options.map(o=>(
                <option key={o.id} value={o.label}>
                  {o.label}{o.price>0?` (+NT$${o.price})`:""}
                </option>
              ))}
            </select>
            <span style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",color:C.muted,pointerEvents:"none"}}>⌄</span>
          </div>
        </div>
      ))}
      <div>
        <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>數量</div>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{width:40,height:40,borderRadius:"50%",background:C.bgDeep,border:`1.5px solid ${C.border}`,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
          <div style={{fontSize:18,fontWeight:700,minWidth:32,textAlign:"center"}}>{qty}</div>
          <button onClick={()=>setQty(q=>Math.min(99,q+1))} style={{width:40,height:40,borderRadius:"50%",background:C.bgDeep,border:`1.5px solid ${C.border}`,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
          {twdPrice>0&&<div style={{marginLeft:"auto",fontSize:12,color:C.muted}}>合計 <span style={{color:C.accent,fontWeight:700}}>{fmtMoney(twdPrice*qty)}</span></div>}
        </div>
      </div>
      <Btn full variant="accent" disabled={!allSelected} onClick={()=>{
        const varLabel=Object.entries(selVariants).map(([g,v])=>`${g}：${v}`).join(" / ");
        const itemName=`${sanitize(product.name)}${varLabel?` / ${varLabel}`:""}`;
        const cartId=product.id+JSON.stringify(selVariants);
        for(let i=0;i<qty;i++)onAdd({...product,id:cartId,name:itemName,price:safePrice(twdPrice)});
        onClose();
      }}>{!allSelected?"請選擇規格":"加入購物車"}</Btn>
    </div>
  );
}

function CatalogTab({products,inStock,rate,cart,onAdd,showCart,setShowCart,updateCartQty,removeFromCart,submitOrder}) {
  const [activeCategory,setActiveCategory] = useState("全部");
  const [search,setSearch] = useState("");
  const [selected,setSelected] = useState(null);
  const [selectedInStock,setSelectedInStock] = useState(null);
  const [showManual,setShowManual] = useState(false);
  const [mName,setMName] = useState("");
  const [mPrice,setMPrice] = useState("");

  const inCart=id=>cart.find(c=>c.id===id);
  const activeProducts=products.filter(p=>p.status==="on");
  const activeInStock=(inStock||[]).filter(i=>i.status==="on");
  const categories=["全部",...Array.from(new Set(activeProducts.map(p=>p.category).filter(Boolean)))];
  const filtered=activeProducts.filter(p=>activeCategory==="全部"||p.category===activeCategory).filter(p=>!search||sanitize(p.name).includes(search)||sanitize(p.category||"").includes(search));

  const ProductGrid=({items,isInStock})=>(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
      {items.map((p,i)=>{
        const qtyInCart=inCart(p.id)?.qty;
        const twdPrice=p.price>0?Math.round(p.price*rate):0;
        return (
          <div key={p.id} className="appear" style={{animationDelay:`${i*.025}s`,background:C.bg,borderRadius:14,overflow:"hidden",cursor:"pointer",border:`1px solid ${C.border}`}} onClick={()=>isInStock?setSelectedInStock(p):setSelected(p)}>
            <div style={{background:"#f5f0ea",aspectRatio:"1/1",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
              {p.image?.startsWith("data:")?<img src={p.image} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:32}}>{p.image||"🛒"}</span>}
              {isInStock&&<span style={{position:"absolute",top:6,left:6,background:C.green,color:"#fff",fontSize:9,padding:"2px 6px",borderRadius:99,fontWeight:600}}>現貨</span>}
              {qtyInCart&&<span style={{position:"absolute",top:6,right:6,background:C.accent,color:"#fff",fontSize:10,width:18,height:18,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{qtyInCart}</span>}
            </div>
            <div style={{padding:"8px 10px 10px"}}>
              <div style={{fontSize:10,color:C.muted,marginBottom:2}}>{sanitize(p.category||"")}</div>
              <div style={{fontSize:11,lineHeight:1.4,color:C.text,marginBottom:4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{sanitize(p.name)}</div>
              {twdPrice>0?<><div style={{fontSize:12,fontWeight:600,color:C.accent}}>{fmtMoney(twdPrice)}</div>{!isInStock&&<div style={{fontSize:10,color:C.faint}}>預估金額</div>}</>:<div style={{fontSize:11,color:C.muted}}>洽詢定價</div>}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16,paddingBottom:cart.length?80:0}}>
      <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4,scrollbarWidth:"none"}}>
        {categories.map(cat=><button key={cat} className={`tab-btn${activeCategory===cat?" on":""}`} onClick={()=>setActiveCategory(cat)}>{cat}</button>)}
      </div>
      <div style={{position:"relative"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜尋商品 / 分類 / 遠征團"
          style={{width:"100%",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:99,padding:"11px 16px 11px 40px",fontSize:13,color:C.text}}
          onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
        <span style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",color:C.faint}}>🔍</span>
        {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.faint,fontSize:18,cursor:"pointer"}}>×</button>}
      </div>
      {activeInStock.length>0&&(
        <Card style={{padding:"16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:14,fontWeight:600}}>現貨商品</div>
            <div style={{fontSize:11,color:C.green}}>現貨在台，可直接購買</div>
          </div>
          <ProductGrid items={activeInStock} isInStock={true}/>
        </Card>
      )}
      <Card style={{padding:"16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:14,fontWeight:600}}>一般商品</div>
          <div style={{fontSize:11,color:C.muted}}>可直接下單。</div>
        </div>
        {filtered.length===0?<div style={{textAlign:"center",padding:"32px 0",color:C.faint,fontSize:13}}>找不到商品</div>:<ProductGrid items={filtered} isInStock={false}/>}
        <div style={{marginTop:16,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
          <div style={{fontSize:12,color:C.muted,marginBottom:10}}>找不到商品？手動填寫需求</div>
          {!showManual
            ?<button onClick={()=>setShowManual(true)} style={{background:C.bgDeep,border:`1.5px solid ${C.border}`,borderRadius:99,padding:"8px 20px",fontSize:12,color:C.textMid,cursor:"pointer"}}>+ 手動輸入</button>
            :<div style={{display:"flex",flexDirection:"column",gap:10}}>
              <Field label="商品名稱 *" value={mName} onChange={v=>setMName(v.slice(0,100))} placeholder="商品名稱、規格、顏色…"/>
              <Field label="金額（NT$）" type="number" value={mPrice} onChange={setMPrice} placeholder="0"/>
              <div style={{display:"flex",gap:8}}>
                <Btn full variant="accent" onClick={()=>{const n=sanitize(mName,100);if(!n)return;onAdd({id:secureUid(),name:n,price:safePrice(mPrice),image:"",category:"手動輸入"});setShowManual(false);setMName("");setMPrice("");}}>加入購物車</Btn>
                <Btn variant="outline" sm onClick={()=>setShowManual(false)}>取消</Btn>
              </div>
            </div>
          }
        </div>
      </Card>
      <Sheet open={!!selected} onClose={()=>setSelected(null)} title={selected?sanitize(selected.name):""}>
        {selected&&<ProductDetailSheet product={selected} onAdd={onAdd} onClose={()=>setSelected(null)} rate={rate}/>}
      </Sheet>
      <Sheet open={!!selectedInStock} onClose={()=>setSelectedInStock(null)} title={selectedInStock?sanitize(selectedInStock.name):""}>
        {selectedInStock&&<ProductDetailSheet product={selectedInStock} onAdd={onAdd} onClose={()=>setSelectedInStock(null)} rate={rate}/>}
      </Sheet>
      <Sheet open={showCart} onClose={()=>setShowCart(false)} title="購物車明細">
        <div style={{display:"flex",flexDirection:"column"}}>
          {cart.length===0
            ?<div style={{textAlign:"center",padding:"32px 0",color:C.faint}}>購物車是空的</div>
            :<>
              {cart.map((item,i)=>(
                <div key={item.id}>
                  <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 0"}}>
                    <div style={{width:48,height:48,background:C.bgDeep,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{item.image&&!item.image.startsWith("data:")?item.image:"🛒"}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:500,color:C.text}}>{item.name}</div>
                      <div style={{fontSize:12,color:C.accent,marginTop:2}}>{item.price>0?fmtMoney(item.price):"洽詢"} × {item.qty}{item.price>0&&<span style={{color:C.muted,marginLeft:8}}>= {fmtMoney(safePrice(item.price)*safeQty(item.qty))}</span>}</div>
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
                <div style={{fontSize:13,color:C.muted}}>合計（{cart.length} 項）</div>
                <div style={{fontSize:20,fontWeight:700}}>{fmtMoney(cart.reduce((s,c)=>s+safePrice(c.price)*safeQty(c.qty),0))}</div>
              </div>
              <Btn full variant="accent" onClick={submitOrder}>確認送出需求</Btn>
              <div style={{fontSize:11,color:C.faint,textAlign:"center",marginTop:12,lineHeight:1.8}}>送出後業者會確認並與您聯繫<br/>代購商品最終價格以業者報價為準</div>
            </>
          }
        </div>
      </Sheet>
    </div>
  );
}

function WishlistTab({wishes,onAddWish,onAddToCart,setTab}) {
  const [name,setName]=useState("");
  const [note,setNote]=useState("");
  const [submitting,setSubmitting]=useState(false);
  const submit=async()=>{if(!name.trim())return;setSubmitting(true);await onAddWish(name,note);setName("");setNote("");setSubmitting(false);};
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Card>
        <div style={{fontSize:16,fontWeight:600,marginBottom:4}}>新增許願</div>
        <div style={{fontSize:13,color:C.muted,marginBottom:16,lineHeight:1.6}}>你可以直接丟商品名、補一點描述，匿名發起集氣。</div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="想看的商品 / 連線主題"
            style={{width:"100%",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"11px 14px",fontSize:14,color:C.text}}
            onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="補充描述（可選）" rows={3}
            style={{width:"100%",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"11px 14px",fontSize:14,color:C.text,resize:"none",fontFamily:"'Noto Sans TC',sans-serif"}}
            onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
          <Btn full variant="accent" onClick={submit} disabled={submitting||!name.trim()}>{submitting?"送出中...":"發起許願"}</Btn>
        </div>
      </Card>
      <Card>
        {!wishes.length
          ?<div style={{fontSize:13,color:C.muted,textAlign:"center",padding:"16px 0"}}>目前還沒有許願商品。</div>
          :wishes.map((w,i)=>{
            const isFound=w.status==="found";
            const hasPrice=isFound&&w.price>0;
            return (
              <div key={w.id}>
                <div style={{padding:"16px 0"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:isFound?10:0}}>
                    <div style={{flex:1,minWidth:0,marginRight:12}}>
                      <div style={{fontSize:14,fontWeight:500,color:C.text}}>{w.name}</div>
                      {w.note&&<div style={{fontSize:12,color:C.muted,marginTop:2}}>{w.note}</div>}
                    </div>
                    <span style={{fontSize:11,border:`1px solid ${isFound?C.green:C.border}`,color:isFound?C.green:C.muted,padding:"3px 10px",borderRadius:99,whiteSpace:"nowrap",flexShrink:0}}>
                      {isFound?"已找到":"許願中"}
                    </span>
                  </div>
                  {isFound&&(
                    <div style={{background:C.greenBg,borderRadius:12,padding:"12px 14px",border:`1px solid ${C.green}30`}}>
                      {hasPrice&&(
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                          <div style={{fontSize:12,color:C.muted}}>業者報價</div>
                          <div style={{fontSize:18,fontWeight:700,color:C.green}}>{fmtMoney(w.price)}</div>
                        </div>
                      )}
                      {w.found_note&&<div style={{fontSize:12,color:C.textMid,marginBottom:10,lineHeight:1.6}}>{w.found_note}</div>}
                      <Btn full variant="accent" sm onClick={()=>{
                        onAddToCart({id:w.id+"_wish",name:w.name,price:hasPrice?w.price:0,image:"",category:"許願商品"});
                        setTab("catalog");
                      }}>
                        加入購物車下單
                      </Btn>
                    </div>
                  )}
                </div>
                {i<wishes.length-1&&<HR/>}
              </div>
            );
          })
        }
      </Card>
    </div>
  );
}

function OrdersTab({orders}) {
  const [filter,setFilter]=useState("all");
  const STEPS=[
    {key:"pending_review",label:"待審核",icon:"🌸"},
    {key:"pending",label:"待採購",icon:"🛒"},
    {key:"bought",label:"已採購",icon:"✨"},
    {key:"shipped",label:"已寄出",icon:"📦"},
    {key:"arrived",label:"已到台",icon:"🎁"},
  ];
  const shipped=["shipped","arrived"];
  const filtered=orders.filter(o=>{
    if(filter==="unshipped")return!shipped.includes(o.status)&&o.status!=="cancelled";
    if(filter==="shipped"){const d=new Date();d.setMonth(d.getMonth()-3);return shipped.includes(o.status)&&new Date(o.created_at||o.createdAt)>d;}
    return true;
  });
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Card style={{padding:"12px 16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          {[["all","全部"],["unshipped","未出貨"],["shipped","已出貨（近三個月）"]].map(([v,l])=>(
            <button key={v} className={`tab-btn${filter===v?" on":""}`} style={{fontSize:12,padding:"6px 14px"}} onClick={()=>setFilter(v)}>{l}</button>
          ))}
          <div style={{marginLeft:"auto",fontSize:12,color:C.muted}}>{filtered.length} 筆</div>
        </div>
      </Card>
      {!filtered.length
        ?<Card><div style={{fontSize:13,color:C.muted,textAlign:"center",padding:"16px 0"}}>目前沒有符合條件的訂單紀錄。</div></Card>
        :filtered.map((o,i)=>{
          const createdDate=o.created_at?new Date(o.created_at).toLocaleDateString("zh-TW"):(o.createdAt||"");
          const curIdx=STEPS.findIndex(s=>s.key===o.status);
          const isCancelled=o.status==="cancelled";
          return (
            <Card key={o.id} className="appear" style={{animationDelay:`${i*.05}s`,padding:0,overflow:"hidden"}}>
              {/* 訂單 Header */}
              <div style={{padding:"14px 18px 12px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:12,color:C.muted,marginBottom:2}}>訂單 #{o.no}</div>
                  <div style={{fontSize:11,color:C.faint}}>{createdDate} · {(o.items||[]).length} 項商品</div>
                </div>
                <div style={{fontSize:14,fontWeight:700,color:C.text}}>{fmtMoney(o.total)}</div>
              </div>

              {/* 每個品項獨立顯示 */}
              {isCancelled
                ?<div style={{padding:"14px 18px",background:C.redBg}}><div style={{fontSize:12,color:C.red}}>❌ 此訂單已取消</div></div>
                :(o.items||[]).map((it,ii)=>{
                  const itemStatus=it.status||o.status||"pending_review";
                  const itemIdx=STEPS.findIndex(s=>s.key===itemStatus);
                  const itemCancelled=itemStatus==="cancelled";
                  return (
                    <div key={ii} style={{borderBottom:ii<(o.items||[]).length-1?`1px solid ${C.border}`:"none"}}>
                      {/* 品項 header */}
                      <div style={{padding:"14px 18px 0",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                        <div style={{flex:1,minWidth:0,marginRight:12}}>
                          <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:2}}>{it.name}</div>
                          <div style={{fontSize:11,color:C.muted}}>×{it.qty}{it.price>0?` · ${fmtMoney(it.price*it.qty)}`:""}</div>
                        </div>
                        <StatusTag status={itemStatus}/>
                      </div>

                      {/* 品項進度條（韓系簡約）*/}
                      {!itemCancelled&&itemIdx>=0&&(
                        <div style={{padding:"12px 18px 16px"}}>
                          <div style={{display:"flex",alignItems:"center"}}>
                            {STEPS.map((s,si)=>{
                              const done=si<itemIdx,active=si===itemIdx,future=si>itemIdx;
                              return (
                                <div key={s.key} style={{display:"flex",alignItems:"center",flex:si<STEPS.length-1?1:0}}>
                                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                                    <div style={{
                                      width: active?20:14, height: active?20:14,
                                      borderRadius:"50%",
                                      background: done?"#3d4a3e": active?"#1c1c1a":"transparent",
                                      border: `1.5px solid ${done?"#3d4a3e":active?"#1c1c1a":"#d0cbc4"}`,
                                      display:"flex",alignItems:"center",justifyContent:"center",
                                      flexShrink:0,
                                      boxShadow: active?"0 2px 8px rgba(28,28,26,0.18)":"none",
                                      transition:"all .35s cubic-bezier(.16,1,.3,1)",
                                    }}>
                                      {done&&<svg width={7} height={7} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                                      {active&&<div style={{width:5,height:5,borderRadius:"50%",background:"#fff"}}/>}
                                    </div>
                                    <div style={{fontSize:9,fontWeight:active?600:400,color:active?"#3d4a3e":done?"#8a9e8b":"#c0bcb8",letterSpacing:.3,whiteSpace:"nowrap"}}>
                                      {s.label}
                                    </div>
                                  </div>
                                  {si<STEPS.length-1&&(
                                    <div style={{flex:1,height:1,margin:"0 4px",marginBottom:14,borderRadius:99,background:"#ede9e3",overflow:"hidden",position:"relative"}}>
                                      <div style={{position:"absolute",inset:0,background:"#3d4a3e",borderRadius:99,transform:`scaleX(${done?1:0})`,transformOrigin:"left",transition:"transform .5s cubic-bezier(.16,1,.3,1)"}}/>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {itemCancelled&&<div style={{padding:"10px 18px 14px"}}><div style={{fontSize:11,color:C.red}}>❌ 此品項已取消</div></div>}
                    </div>
                  );
                })
              }
            </Card>
          );
        })
      }
    </div>
  );
}

function ShipmentsTab({orders}) {
  const [filter,setFilter]=useState("all");
  const shipped=["shipped","arrived"];
  const threeMonthsAgo=new Date();threeMonthsAgo.setMonth(threeMonthsAgo.getMonth()-3);
  const filtered=orders.filter(o=>{
    if(filter==="pending")return!shipped.includes(o.status)&&o.status!=="cancelled";
    if(filter==="shipped")return shipped.includes(o.status)&&new Date(o.created_at||o.createdAt)>threeMonthsAgo;
    return shipped.includes(o.status)||(!shipped.includes(o.status)&&o.status!=="cancelled");
  });
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Card style={{padding:"12px 16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          {[["all","全部"],["pending","待出貨"],["shipped","已出貨（近三個月）"]].map(([v,l])=>(
            <button key={v} className={`tab-btn${filter===v?" on":""}`} style={{fontSize:12,padding:"6px 14px"}} onClick={()=>setFilter(v)}>{l}</button>
          ))}
          <div style={{marginLeft:"auto",fontSize:12,color:C.muted}}>{filtered.length} 筆</div>
        </div>
      </Card>
      {!filtered.length
        ?<Card><div style={{fontSize:13,color:C.muted,textAlign:"center",padding:"16px 0"}}>目前沒有可顯示的出貨資料。</div></Card>
        :filtered.map((o,i)=>{
          const createdDate=o.created_at?new Date(o.created_at).toLocaleDateString("zh-TW"):(o.createdAt||"");
          return (
            <Card key={o.id} className="appear" style={{animationDelay:`${i*.04}s`,padding:0,overflow:"hidden"}}>
              <div style={{padding:"16px 18px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1,minWidth:0,marginRight:12}}>
                    <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:4}}>{o.items?.[0]?.name}{(o.items?.length||0)>1?` 外 ${o.items.length-1} 項`:""}</div>
                    <div style={{fontSize:11,color:C.faint}}>#{o.no} · {createdDate}</div>
                  </div>
                  <StatusTag status={o.status}/>
                </div>
                <div style={{fontSize:11,color:C.muted,marginTop:10}}>{(o.items||[]).map(it=>`${it.name} ×${it.qty}`).join(" · ")}</div>
                <div style={{fontSize:15,fontWeight:700,color:C.accent,marginTop:6}}>{fmtMoney(o.total)}</div>
              </div>
            </Card>
          );
        })
      }
    </div>
  );
}

function MainApp({lineUser,data,setData}) {
  const [tab,setTab]=useState("profile");
  const [cart,setCart]=useState([]);
  const [toast,setToast]=useState(null);
  const [member,setMember]=useState({});
  const [showCart,setShowCart]=useState(false);

  useEffect(()=>{
    injectStyles();
    supabase.from("members").select("*").eq("line_user_id",lineUser.userId).single().then(({data:m})=>{if(m)setMember(m);});

    // ── 全系統即時同步 ──────────────────────────────────────────
    const channel=supabase
      .channel("realtime-all")

      // ── 訂單 ──
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"orders",filter:`customer_line_id=eq.${lineUser.userId}`},
        (payload)=>{
          setData(d=>({...d,orders:d.orders.map(o=>o.id===payload.new.id?{...o,...payload.new}:o)}));
          if(payload.new.status==="cancelled"&&payload.old?.status==="pending_review"){
            setToast("❌ 您的訂單已被拒絕並取消，如有疑問請聯繫業者");
            setTab("orders");
          }
        }
      )
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"orders",filter:`customer_line_id=eq.${lineUser.userId}`},
        (payload)=>{
          setData(d=>({...d,orders:[payload.new,...d.orders.filter(o=>o.id!==payload.new.id)]}));
        }
      )
      .on("postgres_changes",{event:"DELETE",schema:"public",table:"orders"},
        (payload)=>{
          setData(d=>({...d,orders:d.orders.filter(o=>o.id!==payload.old.id)}));
          setToast("🗑️ 一筆訂單已被刪除");
        }
      )

      // ── 商品（一般代購）──
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"products"},
        (payload)=>{setData(d=>({...d,products:[...d.products,payload.new]}));}
      )
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"products"},
        (payload)=>{setData(d=>({...d,products:d.products.map(p=>p.id===payload.new.id?{...p,...payload.new}:p)}));}
      )
      .on("postgres_changes",{event:"DELETE",schema:"public",table:"products"},
        (payload)=>{setData(d=>({...d,products:d.products.filter(p=>p.id!==payload.old.id)}));}
      )

      // ── 現貨商品 ──
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"in_stock"},
        (payload)=>{setData(d=>({...d,inStock:[...d.inStock,payload.new]}));}
      )
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"in_stock"},
        (payload)=>{setData(d=>({...d,inStock:d.inStock.map(p=>p.id===payload.new.id?{...p,...payload.new}:p)}));}
      )
      .on("postgres_changes",{event:"DELETE",schema:"public",table:"in_stock"},
        (payload)=>{setData(d=>({...d,inStock:d.inStock.filter(p=>p.id!==payload.old.id)}));}
      )

      // ── 許願清單 ──
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"wishlist"},
        (payload)=>{setData(d=>({...d,wishlist:d.wishlist.map(w=>w.id===payload.new.id?{...w,...payload.new}:w)}));}
      )
      .on("postgres_changes",{event:"DELETE",schema:"public",table:"wishlist"},
        (payload)=>{setData(d=>({...d,wishlist:d.wishlist.filter(w=>w.id!==payload.old.id)}));}
      )

      // ── 公告 ──
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"announcements"},
        (payload)=>{setData(d=>({...d,announcements:[payload.new,...d.announcements]}));}
      )
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"announcements"},
        (payload)=>{setData(d=>({...d,announcements:d.announcements.map(a=>a.id===payload.new.id?{...a,...payload.new}:a)}));}
      )
      .on("postgres_changes",{event:"DELETE",schema:"public",table:"announcements"},
        (payload)=>{setData(d=>({...d,announcements:d.announcements.filter(a=>a.id!==payload.old.id)}));}
      )

      .subscribe();

    return()=>{supabase.removeChannel(channel);};
  },[]);

  const myOrders=data.orders.filter(o=>o.customer_line_id===lineUser.userId||o.customerId==="me");
  const myWishes=data.wishlist.filter(w=>w.customer_line_id===lineUser.userId||w.customerId==="me");

  const addToCart=item=>{
    const safe={...item,name:sanitize(item.name,100),price:safePrice(item.price)};
    setCart(p=>{const ex=p.find(x=>x.id===safe.id);return ex?p.map(x=>x.id===safe.id?{...x,qty:Math.min(x.qty+1,99)}:x):[...p,{...safe,qty:1,note:""}];});
    setToast("已加入購物車");
  };
  const updateCartQty=(id,delta)=>setCart(p=>p.map(c=>c.id===id?{...c,qty:Math.max(1,Math.min(99,c.qty+delta))}:c));
  const removeFromCart=id=>setCart(p=>p.filter(c=>c.id!==id));

  const submitOrder=async()=>{
    if(!cart.length)return;
    const no=secureOrderNo();
    const items=cart.map(c=>({name:sanitize(c.name,100),qty:safeQty(c.qty),price:safePrice(c.price),note:sanitize(c.note||"",200)}));
    const total=items.reduce((s,c)=>s+c.price*c.qty,0);
    const orderData={id:secureUid(),no,customer_line_id:lineUser.userId,customer_name:sanitize(lineUser.name,50)||"匿名",status:"pending_review",items,total,created_at:new Date().toISOString()};
    try{
      const{data:saved,error}=await supabase.from("orders").insert([orderData]).select().single();
      if(error)throw error;
      setData(d=>({...d,orders:[saved,...d.orders]}));
      setCart([]);setShowCart(false);setTab("orders");setToast("訂單已送出！");
    }catch(e){console.error(e);alert("下單失敗，請稍後再試");}
  };

  const addWish=async(name,note)=>{
    const n=sanitize(name,100);if(!n)return;
    const wishData={id:secureUid(),customer_line_id:lineUser.userId,customer_name:sanitize(lineUser.name,50)||"匿名",name:n,note:sanitize(note,200),status:"searching",created_at:new Date().toISOString()};
    try{
      const{data:saved,error}=await supabase.from("wishlist").insert([wishData]).select().single();
      if(error)throw error;
      setData(d=>({...d,wishlist:[saved,...d.wishlist]}));
    }catch{setData(d=>({...d,wishlist:[wishData,...d.wishlist]}));}
    setToast("許願已送出");
  };

  const HEADER_INFO={
    profile:{subtitle:"CUSTOMER PROFILE",title:lineUser.name,description:"登入後可修改 LINE ID、信箱與寄件資訊，待付款通知也會集中顯示在這裡。"},
    catalog:{subtitle:"SHOP",title:"商品下單",description:"選商品、規格與數量後直接送單。"},
    wishlist:{subtitle:"WISHES",title:"許願 / 集氣牆",description:"想連線或想看的商品都可以先許願。大家一起 +1，達標後管理者就能評估成團。"},
    orders:{subtitle:"ORDERS",title:"訂單詳情",description:"查看已採買項目、應付金額與出貨狀態。"},
    shipments:{subtitle:"SHIPMENTS",title:"本次出貨表",description:"查看目前待出貨與近三個月內已出貨紀錄。"},
  };
  const h=HEADER_INFO[tab]||HEADER_INFO.profile;

  return (
    <div style={{minHeight:"100vh",background:C.bg,maxWidth:480,margin:"0 auto",paddingBottom:40}}>
      <HeaderCard subtitle={h.subtitle} title={h.title} description={h.description} tab={tab} setTab={setTab}
        onLogout={()=>{if(typeof liff!=="undefined")liff.logout();window.location.reload();}}/>
      <div style={{padding:"16px 16px 0"}}>
        {tab==="profile"&&<ProfileTab member={member} setMember={setMember} lineUser={lineUser} setToast={setToast}/>}
        {tab==="catalog"&&<CatalogTab products={data.products} inStock={data.inStock} rate={data.rate} cart={cart} onAdd={addToCart} showCart={showCart} setShowCart={setShowCart} updateCartQty={updateCartQty} removeFromCart={removeFromCart} submitOrder={submitOrder}/>}
        {tab==="wishlist"&&<WishlistTab wishes={myWishes} onAddWish={addWish} onAddToCart={addToCart} setTab={setTab}/>}
        {tab==="orders"&&<OrdersTab orders={myOrders}/>}
        {tab==="shipments"&&<ShipmentsTab orders={myOrders}/>}
      </div>
      {cart.length>0&&tab==="catalog"&&(
        <div className="appear" style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:C.bgDark,color:"#f5f0eb",padding:"14px 20px",display:"flex",alignItems:"center",gap:12,zIndex:150,borderRadius:"16px 16px 0 0",boxShadow:C.shadowMd}}>
          <div style={{flex:1,cursor:"pointer"}} onClick={()=>setShowCart(true)}>
            <div style={{fontSize:11,color:"rgba(245,240,235,.5)"}}>購物車 · {cart.length} 項</div>
            <div style={{fontSize:15,fontWeight:600,marginTop:2}}>{fmtMoney(cart.reduce((s,c)=>s+safePrice(c.price)*safeQty(c.qty),0))}</div>
          </div>
          <Btn sm variant="accent" onClick={()=>setShowCart(true)}>查看</Btn>
        </div>
      )}
      {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
    </div>
  );
}

export default function App() {
  const [lineUser,setLineUser]=useState(null);
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{injectStyles();},[]);

  const handleLogin=async(user)=>{
    setLineUser(user);
    const[{data:products},{data:inStockData},{data:orders},{data:wishlist},{data:announcements}]=await Promise.all([
      supabase.from("products").select("*").eq("status","on"),
      supabase.from("in_stock").select("*").eq("status","on"),
      supabase.from("orders").select("*").eq("customer_line_id",user.userId).order("created_at",{ascending:false}),
      supabase.from("wishlist").select("*").eq("customer_line_id",user.userId),
      supabase.from("announcements").select("*").order("created_at",{ascending:false}),
    ]);
    setData({rate:1,products:products||INIT_DATA.products,inStock:inStockData||INIT_DATA.inStock,orders:orders||INIT_DATA.orders,wishlist:wishlist||INIT_DATA.wishlist,announcements:announcements||INIT_DATA.announcements});
    setLoading(false);
  };

  if(!lineUser)return<LineLogin onSuccess={handleLogin}/>;
  if(loading||!data)return<div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{fontSize:28,animation:"spin 1.2s linear infinite",color:C.muted}}>◌</div></div>;
  return<MainApp lineUser={lineUser} data={data} setData={setData}/>;
}
