import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ─── 下單系統 ── 客人端 ──────────────────────────────────────────
const APP_NAME = "下單系統";

// ─── Korean Literary Café Palette ────────────────────────────────
const C = {
  bg:         "#f5f3ef",
  bgDeep:     "#edeae4",
  bgDark:     "#1c1c1a",
  surface:    "#ffffff",
  surfaceWarm:"#faf8f5",
  border:     "#dedad4",
  borderMid:  "#c8c4bc",
  text:       "#1c1c1a",
  textMid:    "#4a4744",
  muted:      "#8a8680",
  faint:      "#c0bcb8",
  accent:     "#3d4a3e",
  accentLight:"#6b7d6c",
  accentBg:   "#eaede8",
  green:      "#4a7c59",
  greenBg:    "#edf2ee",
  amber:      "#8a6d3b",
  amberBg:    "#f5f0e8",
  red:        "#7a4040",
  redBg:      "#f5eaea",
  blue:       "#3a5470",
  blueBg:     "#e8edf2",
  purple:     "#5a4870",
  purpleBg:   "#eeeaf2",
  shadow:     "0 1px 8px rgba(28,28,26,0.07)",
  shadowMd:   "0 4px 20px rgba(28,28,26,0.10)",
  shadowLg:   "0 8px 40px rgba(28,28,26,0.14)",
};

const ORDER_STATUS = {
  pending_review: { label:"審核中", color:C.blue,   bg:C.blueBg   },
  pending:        { label:"待採購", color:C.amber,  bg:C.amberBg  },
  bought:         { label:"已採購", color:C.green,  bg:C.greenBg  },
  shipped:        { label:"已寄出", color:C.purple, bg:C.purpleBg },
  arrived:        { label:"已到台", color:C.accent, bg:C.accentBg },
  cancelled:      { label:"已取消", color:C.red,    bg:C.redBg    },
};

// ─── Security ────────────────────────────────────────────────────
const secureUid = () => {
  const a = new Uint8Array(9);
  crypto.getRandomValues(a);
  return Array.from(a, b => b.toString(36).padStart(2,"0")).join("").slice(0,12);
};
const sanitize = (s, max=200) =>
  String(s??"").replace(/<[^>]*>/g,"").replace(/[<>"'`\\]/g,"").replace(/javascript:/gi,"").trim().slice(0,max);
const safeQty   = n => { const v=parseInt(n,10);  return Number.isFinite(v)&&v>=1&&v<=99?v:1; };
const safePrice = n => { const v=Number(n);       return Number.isFinite(v)&&v>=0?Math.round(v*100)/100:0; };
const secureOrderNo = () => { const a=new Uint32Array(1); crypto.getRandomValues(a); return String(100000+(a[0]%900000)); };
const isValidLineUserId = id => typeof id==="string"&&/^U[a-f0-9]{32}$/.test(id);
const fmtMoney  = n => `NT$ ${Number(n||0).toLocaleString()}`;
const today     = () => new Date().toLocaleDateString("zh-TW");

// ─── Initial data ────────────────────────────────────────────────
const INIT_DATA = {
  rate: 0.26,
  products: [
    { id:"p1", name:"高島屋土產代購",   price:0,    image:"🏯", status:"on", category:"土產",    tag:"代購" },
    { id:"p2", name:"無印良品代購",     price:0,    image:"🛍", status:"on", category:"生活",    tag:"代購" },
    { id:"p3", name:"藥妝代購",         price:0,    image:"💊", status:"on", category:"藥妝",    tag:"代購" },
    { id:"p4", name:"7-11代購",         price:0,    image:"🏪", status:"on", category:"便利商店", tag:"代購" },
    { id:"p5", name:"吉伊卡哇扭蛋",    price:0,    image:"🎪", status:"on", category:"玩具",    tag:"代購" },
  ],
  inStock: [
    { id:"s1", name:"Hello Kitty 扭蛋 草莓款", price:350, image:"🎀", status:"on" },
    { id:"s2", name:"Sanrio 扭蛋 新款",         price:280, image:"⭐", status:"on" },
  ],
  orders: [
    { id:"o1", no:"735102", customerId:"me", customerName:"曉曉", status:"cancelled", items:[{name:"7-11代購",qty:1,price:39,note:""}],       total:39,  createdAt:"2026-04-16" },
    { id:"o2", no:"730891", customerId:"me", customerName:"曉曉", status:"bought",    items:[{name:"資生堂防曬乳",qty:1,price:728,note:""}], total:728, createdAt:"2026-04-14" },
  ],
  wishlist: [
    { id:"w1", customerId:"me", name:"限定版茶杯組", note:"京都限定款", status:"searching" },
  ],
  announcements: [
    { id:"an1", title:"4/21 第一天行程公告", createdAt:"2026-04-17",
      content:"藥妝 711 吉伊卡哇手遊 高島屋土產\n08:00 SUGI藥妝（美妝為主）\n── 停留 1 小時 ──\n09:10 7-11（零食採買）\n── 停留 30 分鐘 ──\n09:45 唐吉軻德\n── 停留 1 小時 ──\n11:00 難波丸井百貨\n── 停留 2.5 小時 ──\n15:35 Muji 無印良品\n── 停留 1 小時 ──\n21:00 扭蛋店開扭（至關門 23:00）" }
  ],
};
const INIT_MEMBER = { name:"", phone:"", birthday:"", email:"" };

// ─── Styles ──────────────────────────────────────────────────────
const injectStyles = () => {
  if (document.getElementById("kr-lit-styles")) return;
  const s = document.createElement("style");
  s.id = "kr-lit-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@300;400;500&family=Noto+Sans+TC:wght@300;400;500;600&family=IM+Fell+English:ital@0;1&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:${C.bg};color:${C.text};font-family:'Noto Sans TC',sans-serif;min-height:100vh;-webkit-font-smoothing:antialiased}
    ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:${C.faint}}
    input,select,textarea,button{font-family:'Noto Sans TC',sans-serif;outline:none}
    .appear{animation:appear .35s cubic-bezier(.16,1,.3,1) both}
    @keyframes appear{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
    .nav-bar{display:flex;border-top:1px solid ${C.border};background:${C.surface};position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;z-index:100}
    .nav-btn{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 4px 8px;border:none;background:transparent;cursor:pointer;color:${C.faint};font-size:10px;font-weight:400;letter-spacing:.5px;gap:3px;transition:color .15s;font-family:'Noto Sans TC',sans-serif}
    .nav-btn.on{color:${C.accent};font-weight:500}
    @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
    input[type=number]{-moz-appearance:textfield}
    input::-webkit-inner-spin-button,input::-webkit-outer-spin-button{-webkit-appearance:none}
  `;
  document.head.appendChild(s);
};

// ─── SVG icon helper ─────────────────────────────────────────────
const PATHS = {
  home:   "M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z",
  store:  "M3 9h18M3 9l2-5h14l2 5M3 9v11a1 1 0 001 1h16a1 1 0 001-1V9M9 21V12h6v9",
  cart:   "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0",
  list:   "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6M9 16h4",
  user:   "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  check:  "M20 6L9 17l-5-5",
  x:      "M18 6L6 18M6 6l12 12",
  edit:   "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  heart:  "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
};
const I = ({ k, size=18, style:sx }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={sx}>
    <path d={PATHS[k]}/>
  </svg>
);

// ─── UI Atoms ────────────────────────────────────────────────────
const HR = ({ style:sx }) => <div style={{ height:1, background:C.border, ...sx }} />;

const Btn = ({ children, onClick, v="dark", sm, full, style:sx, disabled }) => {
  const vars = {
    dark:    { background:C.bgDark, color:"#f5f3ef", border:"none" },
    outline: { background:"transparent", color:C.text, border:`1px solid ${C.borderMid}` },
    ghost:   { background:"transparent", color:C.muted, border:"none" },
    green:   { background:C.greenBg, color:C.green, border:`1px solid ${C.green}50` },
    line:    { background:"#00b900", color:"#fff", border:"none" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6,
      padding: sm?"7px 14px":"11px 20px", fontSize: sm?12:13, fontWeight:400,
      letterSpacing:.4, cursor:disabled?"not-allowed":"pointer",
      opacity:disabled?.4:1, transition:"opacity .15s",
      width:full?"100%":undefined,
      ...vars[v], ...sx,
    }}
      onMouseEnter={e=>{ if(!disabled) e.currentTarget.style.opacity=".7"; }}
      onMouseLeave={e=>{ e.currentTarget.style.opacity=disabled?".4":"1"; }}
    >{children}</button>
  );
};

const Field = ({ label, value, onChange, type="text", placeholder, readOnly, style:sx }) => (
  <div style={{ display:"flex", flexDirection:"column", gap:6, ...sx }}>
    {label && <label style={{ fontSize:10, color:C.muted, fontWeight:500, letterSpacing:1, textTransform:"uppercase" }}>{label}</label>}
    <input
      type={type} value={value}
      onChange={e=>onChange?.(e.target.value)}
      placeholder={placeholder} readOnly={readOnly}
      style={{
        background:readOnly?C.bgDeep:C.surface,
        border:`1px solid ${C.border}`,
        padding:"10px 12px", color:readOnly?C.muted:C.text,
        fontSize:14, transition:"border .15s, box-shadow .15s",
        borderRadius:0,
      }}
      onFocus={e=>{ if(!readOnly){ e.target.style.borderColor=C.accent; e.target.style.boxShadow=`0 0 0 2px ${C.accent}18`; }}}
      onBlur={e=>{ e.target.style.borderColor=C.border; e.target.style.boxShadow="none"; }}
    />
  </div>
);

const StatusTag = ({ status }) => {
  const s = ORDER_STATUS[status]||ORDER_STATUS.pending;
  return (
    <span style={{ fontSize:10, color:s.color, background:s.bg, padding:"3px 10px", letterSpacing:.6, fontWeight:500, whiteSpace:"nowrap" }}>
      {s.label}
    </span>
  );
};

const Toast = ({ msg, onDone }) => {
  useState(()=>{ const t=setTimeout(onDone,2200); return ()=>clearTimeout(t); });
  return (
    <div style={{ position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)", background:C.bgDark, color:"#f5f3ef", padding:"10px 22px", fontSize:12, letterSpacing:.5, boxShadow:C.shadowMd, zIndex:2000, whiteSpace:"nowrap", animation:"appear .2s ease" }}>
      {msg}
    </div>
  );
};

// Bottom sheet
const Sheet = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div style={{ position:"fixed", inset:0, zIndex:500 }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(28,28,26,.5)", backdropFilter:"blur(3px)" }} onClick={onClose} />
      <div className="appear" style={{ position:"absolute", bottom:0, left:0, right:0, background:C.surface, maxHeight:"88vh", overflow:"auto", borderTop:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 20px", borderBottom:`1px solid ${C.border}` }}>
          <span style={{ fontFamily:"'Noto Serif TC',serif", fontSize:15, fontWeight:400, letterSpacing:1 }}>{title}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", padding:4, display:"flex" }}>
            <I k="x" size={16} />
          </button>
        </div>
        <div style={{ padding:"22px 20px 48px" }}>{children}</div>
      </div>
    </div>
  );
};

// Section header (EN + KR style)
const SecHead = ({ en, zh }) => (
  <div style={{ marginBottom:20 }}>
    <div style={{ fontFamily:"'IM Fell English',serif", fontStyle:"italic", fontSize:10, color:C.muted, letterSpacing:2.5, textTransform:"uppercase", marginBottom:8 }}>{en}</div>
    <div style={{ fontFamily:"'Noto Serif TC',serif", fontSize:19, fontWeight:300, letterSpacing:2, color:C.text }}>{zh}</div>
    <div style={{ width:28, height:1, background:C.borderMid, marginTop:12 }} />
  </div>
);

// ─── LINE Login ───────────────────────────────────────────────────
function LineLogin({ onSuccess }) {
  const [status, setStatus] = useState("init");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const liffId = import.meta.env.VITE_LIFF_ID;
    if (!liffId) {
      setStatus("error");
      setErrorMsg("未設定 LIFF ID，請檢查 .env 檔案");
      return;
    }
    setStatus("loading");
    liff.init({ liffId })
      .then(() => {
        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }
        return liff.getProfile();
      })
      .then(profile => {
        if (!profile) return;
        onSuccess({
          name: sanitize(profile.displayName, 50) || "匿名",
          userId: profile.userId,
          pictureUrl: profile.pictureUrl,
        });
      })
      .catch(() => {
        setStatus("error");
        setErrorMsg("LINE 登入失敗，請重新整理再試");
      });
  }, []);

  if (status === "error") return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32, gap:16 }}>
      <div style={{ fontFamily:"'Noto Serif TC',serif", fontSize:22, fontWeight:300, color:C.text, letterSpacing:2, marginBottom:8 }}>{APP_NAME}</div>
      <div style={{ fontSize:13, color:C.red, textAlign:"center", lineHeight:2 }}>{errorMsg}</div>
      <button onClick={() => window.location.reload()} style={{ background:C.bgDark, color:"#f5f3ef", border:"none", padding:"10px 24px", cursor:"pointer", fontSize:13, letterSpacing:.5 }}>
        重新整理
      </button>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
      <div style={{ fontFamily:"'Noto Serif TC',serif", fontSize:22, fontWeight:300, color:C.text, letterSpacing:2, marginBottom:8 }}>{APP_NAME}</div>
      <div style={{ fontSize:28, animation:"spin 1.2s linear infinite", display:"inline-block", color:C.muted }}>◌</div>
      <div style={{ fontSize:13, color:C.muted, letterSpacing:1 }}>LINE 登入中</div>
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────
function MainApp({ lineUser, data, setData }) {
  const [tab, setTab]         = useState("home");
  const [cart, setCart]       = useState([]);
  const [toast, setToast]     = useState(null);
  const [notif, setNotif]     = useState(null);
  const [member, setMember]   = useState({ ...INIT_MEMBER, name:lineUser.name });

  const myOrders = data.orders.filter(o =>
    o.customer_line_id === lineUser.userId || o.customerId === "me"
  );
  const myWishes = data.wishlist.filter(w =>
    w.customer_line_id === lineUser.userId || w.customerId === "me"
  );

  const addToCart = item => {
    const safe = { ...item, name:sanitize(item.name,100), price:safePrice(item.price) };
    setCart(p => {
      const ex=p.find(x=>x.id===safe.id);
      return ex ? p.map(x=>x.id===safe.id?{...x,qty:Math.min(x.qty+1,99)}:x) : [...p,{...safe,qty:1,note:""}];
    });
    setToast("已加入");
  };

  const submitOrder = async () => {
    if (!cart.length) return;
    const no = secureOrderNo();
    const items = cart.map(c=>({ name:sanitize(c.name,100), qty:safeQty(c.qty), price:safePrice(c.price), note:sanitize(c.note||"",200) }));
    const total = items.reduce((s,c)=>s+c.price*c.qty,0);
    if (total<0||total>9_999_999) return;
    const orderData = {
      id: secureUid(), no,
      customer_line_id: lineUser.userId,
      customer_name: sanitize(lineUser.name,50)||"匿名",
      status: "pending_review",
      items, total,
      created_at: new Date().toISOString(),
    };
    try {
      const { data: saved, error } = await supabase
        .from("orders").insert([orderData]).select().single();
      if (error) throw error;
      setData(d=>({...d, orders:[saved,...d.orders]}));
      setCart([]); setTab("orders");
      setNotif({ no, items, total, name: orderData.customer_name });
    } catch(e) {
      console.error(e);
      alert("下單失敗，請稍後再試");
    }
  };

  const addWish = async (name, note) => {
    const n=sanitize(name,100); if(!n) return;
    const wishData = {
      id: secureUid(),
      customer_line_id: lineUser.userId,
      customer_name: sanitize(lineUser.name,50)||"匿名",
      name: n, note: sanitize(note,200),
      status: "searching",
      created_at: new Date().toISOString(),
    };
    try {
      const { data: saved, error } = await supabase
        .from("wishlist").insert([wishData]).select().single();
      if (error) throw error;
      setData(d=>({...d, wishlist:[saved,...d.wishlist]}));
    } catch(e) {
      // fallback to local
      setData(d=>({...d, wishlist:[wishData,...d.wishlist]}));
    }
    setToast("許願已送出");
  };

  const [showCart, setShowCart] = useState(false);

  const NAV = [
    { id:"home",    label:"公告",  icon:"home"  },
    { id:"instock", label:"現貨",  icon:"store" },
    { id:"catalog", label:"賣場",  icon:"cart"  },
    { id:"orders",  label:"訂單",  icon:"list"  },
    { id:"member",  label:"會員",  icon:"user"  },
  ];

  const updateCartQty = (id, delta) => {
    setCart(p => p.map(c => c.id === id
      ? { ...c, qty: Math.max(1, Math.min(99, c.qty + delta)) }
      : c
    ));
  };
  const removeFromCart = (id) => setCart(p => p.filter(c => c.id !== id));

  return (
    <div style={{ minHeight:"100vh", background:C.bg, maxWidth:480, margin:"0 auto", display:"flex", flexDirection:"column" }}>
      {/* Top bar */}
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"14px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, zIndex:200 }}>
        <div style={{ fontFamily:"'Noto Serif TC',serif", fontSize:15, fontWeight:400, letterSpacing:2.5, color:C.text }}>{APP_NAME}</div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {cart.length>0 && (
            <div style={{ background:C.bgDark, color:"#f5f3ef", padding:"3px 10px", fontSize:10, letterSpacing:.5, cursor:"pointer" }} onClick={()=>setShowCart(true)}>
              購物車 {cart.length}
            </div>
          )}
          <div style={{ fontSize:11, color:C.muted, letterSpacing:.4 }}>{lineUser.name}</div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, paddingBottom:70, overflowY:"auto" }}>
        {tab==="home"    && <HomeTab    announcements={data.announcements} />}
        {tab==="instock" && <InStockTab items={data.inStock} cart={cart} onAdd={addToCart} rate={data.rate} />}
        {tab==="catalog" && <CatalogTab products={data.products} rate={data.rate} cart={cart} onAdd={addToCart} />}
        {tab==="orders"  && <OrdersTab  orders={myOrders} />}
        {tab==="member"  && <MemberTab  member={member} setMember={setMember} lineUser={lineUser} wishes={myWishes} onAddWish={addWish} />}
      </div>

      {/* Cart sticky bar */}
      {cart.length>0 && tab!=="member" && (
        <div className="appear" style={{ position:"fixed", bottom:58, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:C.bgDark, color:"#f5f3ef", padding:"12px 20px", display:"flex", alignItems:"center", gap:16, zIndex:150 }}>
          <div style={{ flex:1, cursor:"pointer" }} onClick={()=>setShowCart(true)}>
            <div style={{ fontSize:10, color:"rgba(245,243,239,.5)", letterSpacing:.6 }}>購物車 · {cart.length} 項　點擊查看明細</div>
            <div style={{ fontSize:14, fontWeight:400, marginTop:2 }}>{fmtMoney(cart.reduce((s,c)=>s+safePrice(c.price)*safeQty(c.qty),0))}</div>
          </div>
          <button onClick={()=>setCart([])} style={{ background:"transparent", border:"1px solid rgba(245,243,239,.25)", color:"rgba(245,243,239,.6)", padding:"6px 12px", fontSize:11, cursor:"pointer", letterSpacing:.4 }}>清空</button>
          <button onClick={()=>setShowCart(true)} style={{ background:"#f5f3ef", border:"none", color:C.bgDark, padding:"6px 18px", fontSize:12, fontWeight:500, cursor:"pointer", letterSpacing:.4 }}>查看購物車</button>
        </div>
      )}

      {/* Cart Review Sheet */}
      <Sheet open={showCart} onClose={()=>setShowCart(false)} title="購物車明細">
        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          {cart.length === 0 ? (
            <div style={{ textAlign:"center", padding:"32px 0", color:C.faint, fontSize:13 }}>購物車是空的</div>
          ) : (
            <>
              {/* Cart items */}
              {cart.map((item, i) => (
                <div key={item.id}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 0" }}>
                    {/* Image */}
                    <div style={{ width:48, height:48, background:C.bgDeep, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>
                      {item.image && !item.image.startsWith("data:") ? item.image : "🛒"}
                    </div>
                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:500, letterSpacing:.3, color:C.text }}>{item.name}</div>
                      <div style={{ fontSize:12, color:C.accent, marginTop:3 }}>
                        {item.price > 0 ? fmtMoney(item.price) : "洽詢"} × {item.qty}
                        {item.price > 0 && <span style={{ color:C.muted, marginLeft:8 }}>= {fmtMoney(safePrice(item.price)*safeQty(item.qty))}</span>}
                      </div>
                    </div>
                    {/* Qty controls */}
                    <div style={{ display:"flex", alignItems:"center", gap:0, flexShrink:0 }}>
                      <button onClick={()=>updateCartQty(item.id,-1)} style={{ width:28, height:28, border:`1px solid ${C.border}`, background:"transparent", color:C.textMid, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>
                      <div style={{ width:32, textAlign:"center", fontSize:13, border:`1px solid ${C.border}`, borderLeft:"none", borderRight:"none", height:28, lineHeight:"28px" }}>{item.qty}</div>
                      <button onClick={()=>updateCartQty(item.id,1)} style={{ width:28, height:28, border:`1px solid ${C.border}`, background:"transparent", color:C.textMid, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
                    </div>
                    {/* Delete */}
                    <button onClick={()=>removeFromCart(item.id)} style={{ background:"none", border:"none", color:C.faint, fontSize:18, cursor:"pointer", padding:"0 4px" }}>×</button>
                  </div>
                  {i < cart.length-1 && <HR />}
                </div>
              ))}

              {/* 備註欄 */}
              <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${C.border}` }}>
                <div style={{ fontSize:10, color:C.muted, letterSpacing:.8, textTransform:"uppercase", marginBottom:8 }}>備註（選填）</div>
                <textarea
                  placeholder="尺寸、顏色、特別需求…"
                  rows={3}
                  id="cart-note"
                  style={{ width:"100%", background:C.bgDeep, border:`1px solid ${C.border}`, padding:"10px 12px", fontSize:13, color:C.text, resize:"none", fontFamily:"'Noto Sans TC',sans-serif", lineHeight:1.7 }}
                  onFocus={e=>{ e.target.style.borderColor=C.accent; e.target.style.boxShadow=`0 0 0 2px ${C.accent}15`; }}
                  onBlur={e=>{ e.target.style.borderColor=C.border; e.target.style.boxShadow="none"; }}
                />
              </div>

              {/* 合計 */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 0", marginTop:8, borderTop:`1px solid ${C.border}` }}>
                <div style={{ fontSize:12, color:C.muted, letterSpacing:.5 }}>合計（{cart.length} 項）</div>
                <div style={{ fontFamily:"'Noto Serif TC',serif", fontSize:20, fontWeight:400, color:C.text }}>
                  {fmtMoney(cart.reduce((s,c)=>s+safePrice(c.price)*safeQty(c.qty),0))}
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display:"flex", gap:10 }}>
                <Btn full v="dark" onClick={async ()=>{
                  setShowCart(false);
                  await submitOrder();
                }}>確認送出需求</Btn>
                <Btn v="outline" sm onClick={()=>setShowCart(false)}>繼續選購</Btn>
              </div>

              <div style={{ fontSize:10, color:C.faint, textAlign:"center", marginTop:12, letterSpacing:.5, lineHeight:1.8 }}>
                送出後業者會確認並與您聯繫<br/>
                代購商品最終價格以業者報價為準
              </div>
            </>
          )}
        </div>
      </Sheet>

      {/* Bottom nav */}
      <nav className="nav-bar">
        {NAV.map(n=>(
          <button key={n.id} className={`nav-btn${tab===n.id?" on":""}`} onClick={()=>setTab(n.id)}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={tab===n.id?"1.8":"1.4"} strokeLinecap="round" strokeLinejoin="round">
              <path d={PATHS[n.icon]}/>
            </svg>
            {n.label}
          </button>
        ))}
      </nav>

      {notif && <NotifSheet notif={notif} onClose={()=>{ setNotif(null); setToast("訂單已送出"); }} />}
      {toast && <Toast msg={toast} onDone={()=>setToast(null)} />}
    </div>
  );
}

// ─── Home (Announcements) ─────────────────────────────────────────
function HomeTab({ announcements }) {
  return (
    <div style={{ padding:"28px 20px 20px" }}>
      <SecHead en="Notice Board" zh="公 告" />
      {(!announcements||!announcements.length) ? (
        <div style={{ textAlign:"center", padding:"56px 0", color:C.faint, fontSize:12, letterSpacing:1 }}>目前沒有公告</div>
      ) : announcements.map((a,i) => (
        <div key={a.id} className="appear" style={{ animationDelay:`${i*.06}s`, marginBottom:28 }}>
          <div style={{ display:"flex", gap:14, alignItems:"flex-start", marginBottom:14 }}>
            <div style={{ width:2, background:C.accent, alignSelf:"stretch", flexShrink:0, minHeight:36 }} />
            <div>
              <div style={{ fontFamily:"'Noto Serif TC',serif", fontSize:14, fontWeight:400, letterSpacing:.8, color:C.text }}>{a.title}</div>
              <div style={{ fontSize:10, color:C.faint, marginTop:4, letterSpacing:.5 }}>{a.createdAt}</div>
            </div>
          </div>
          <pre style={{ fontSize:13, color:C.textMid, lineHeight:2.1, whiteSpace:"pre-wrap", fontFamily:"'Noto Sans TC',sans-serif", letterSpacing:.3, paddingLeft:16, borderLeft:`1px solid ${C.border}` }}>
            {a.content}
          </pre>
          {i<announcements.length-1 && <HR style={{ marginTop:24 }} />}
        </div>
      ))}
    </div>
  );
}

// ─── Product Detail Sheet (standalone component to fix Hook rules) ─
function ProductDetailSheet({ product, allProducts, cart, onAdd, onClose, rate }) {
  const [selVariants, setSelVariants] = useState({});
  const [qty, setQty] = useState(1);
  if (!product) return null;

  const hasVariants = product.variants && product.variants.length > 0;
  const variantGroups = (() => {
    if (!hasVariants) return [];
    const groups = {};
    product.variants.forEach(v => {
      const parts = v.name.includes(":") ? v.name.split(":") : ["款式", v.name];
      const g = parts[0], n = parts[1] || parts[0];
      if (!groups[g]) groups[g] = [];
      groups[g].push({ ...v, label: n });
    });
    return Object.entries(groups);
  })();
  const jpyPrice = product.price || 0;
  const twdPrice = Math.round(jpyPrice * (rate || 0.26));
  const allSelected = variantGroups.length === 0 || variantGroups.every(([g]) => selVariants[g]);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
      <div style={{ background:"#f5f0ea", aspectRatio:"4/3", display:"flex", alignItems:"center", justifyContent:"center", fontSize:72, margin:"0 -20px -4px", borderRadius:"16px 16px 0 0", overflow:"hidden" }}>
        {product.image && product.image.startsWith("data:")
          ? <img src={product.image} alt={product.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          : product.image
            ? <span style={{ fontSize:64 }}>{product.image}</span>
            : <svg width={64} height={64} viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth=".8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9l4-4 4 4 4-4 4 4"/><path d="M3 15l4 4 4-4 4 4 4-4"/></svg>}
      </div>
      <div style={{ marginTop:16, marginBottom:12 }}>
        <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>{sanitize(product.category)}</div>
        <div style={{ fontSize:16, fontWeight:600, lineHeight:1.5, color:C.text }}>{sanitize(product.name)}</div>
      </div>
      {twdPrice > 0 && (
        <div style={{ background:C.bgDeep, borderRadius:12, padding:"14px 16px", marginBottom:16 }}>
          <div style={{ fontSize:12, color:C.muted, fontWeight:600, marginBottom:8 }}>訂單資料</div>
          <div style={{ fontSize:13, color:C.textMid, lineHeight:2 }}>
            <div style={{ fontWeight:600, color:C.text, fontSize:18 }}>NT$ {twdPrice.toLocaleString()}</div>
            <div style={{ fontSize:11, color:C.muted }}>JPY {jpyPrice.toLocaleString()} × 匯率 {rate || 0.26}</div>
          </div>
        </div>
      )}
      {variantGroups.map(([groupName, options]) => (
        <div key={groupName} style={{ marginBottom:14 }}>
          <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:8 }}>{groupName}</div>
          <div style={{ position:"relative" }}>
            <select value={selVariants[groupName] || ""} onChange={e => setSelVariants(p => ({ ...p, [groupName]: e.target.value }))}
              style={{ width:"100%", background:C.surface, border:`1.5px solid ${selVariants[groupName] ? C.accent : C.border}`, borderRadius:10, padding:"11px 36px 11px 14px", fontSize:14, color:selVariants[groupName] ? C.text : C.muted, appearance:"none", cursor:"pointer" }}>
              <option value="">請選擇{groupName}</option>
              {options.map(o => <option key={o.id} value={o.label}>{o.label}</option>)}
            </select>
            <span style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", color:C.muted, pointerEvents:"none" }}>⌄</span>
          </div>
        </div>
      ))}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:10 }}>數量</div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <button onClick={() => setQty(q => Math.max(1,q-1))} style={{ width:40, height:40, borderRadius:"50%", background:C.bgDeep, border:`1.5px solid ${C.border}`, fontSize:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.textMid }}>−</button>
          <div style={{ fontSize:18, fontWeight:600, minWidth:32, textAlign:"center" }}>{qty}</div>
          <button onClick={() => setQty(q => Math.min(99,q+1))} style={{ width:40, height:40, borderRadius:"50%", background:C.bgDeep, border:`1.5px solid ${C.border}`, fontSize:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.textMid }}>+</button>
          {twdPrice > 0 && <div style={{ marginLeft:"auto", fontSize:12, color:C.muted }}>{qty} 件約 <span style={{ color:C.accent, fontWeight:600 }}>NT$ {(twdPrice*qty).toLocaleString()}</span></div>}
        </div>
      </div>
      <button disabled={!allSelected} onClick={() => {
        const varLabel = Object.entries(selVariants).map(([g,v])=>`${g}：${v}`).join(" / ");
        const itemName = `${sanitize(product.name)}${varLabel ? ` / ${varLabel}` : ""}`;
        const cartId = product.id + JSON.stringify(selVariants);
        for (let i = 0; i < qty; i++) onAdd({ ...product, id:cartId, name:itemName, price:safePrice(twdPrice) });
        onClose();
      }} style={{ width:"100%", padding:"15px", borderRadius:99, background:allSelected?C.accent:C.bgDeep, color:allSelected?"#fff":C.muted, border:"none", fontSize:15, fontWeight:600, cursor:allSelected?"pointer":"not-allowed", transition:"all .2s" }}>
        {!allSelected ? "請選擇規格" : `加入購物車`}
      </button>
    </div>
  );
}

function InStockTab({ items, cart, onAdd, rate }) {
  const [selected, setSelected] = useState(null);
  const inCart = id => cart.find(c => c.id === id);
  const active = items.filter(i => i.status === "on");
  return (
    <div style={{ paddingBottom:20 }}>
      <div style={{ padding:"20px 16px 12px" }}>
        <div style={{ fontSize:10, color:C.muted, letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>IN STOCK</div>
        <div style={{ fontSize:22, fontWeight:700, color:C.text }}>現貨商品</div>
        <div style={{ fontSize:12, color:C.green, marginTop:4 }}>現貨在台，可直接購買</div>
      </div>
      {!active.length ? (
        <div style={{ textAlign:"center", padding:"56px 0", color:C.faint, fontSize:13 }}>目前無現貨</div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, padding:"0 12px" }}>
          {active.map((item, i) => {
            const qtyInCart = inCart(item.id)?.qty;
            return (
              <div key={item.id} className="appear" style={{ animationDelay:`${i*.03}s`, background:C.surface, borderRadius:14, overflow:"hidden", boxShadow:"0 1px 8px rgba(0,0,0,.06)", cursor:"pointer" }} onClick={() => setSelected(item)}>
                <div style={{ background:"#f5f0ea", aspectRatio:"1/1", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
                  {item.image && item.image.startsWith("data:") ? <img src={item.image} alt={item.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    : item.image ? <span style={{ fontSize:36 }}>{item.image}</span>
                    : <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9l4-4 4 4 4-4 4 4"/><path d="M3 15l4 4 4-4 4 4 4-4"/></svg>}
                  <span style={{ position:"absolute", top:6, left:6, background:C.green, color:"#fff", fontSize:9, padding:"2px 6px", borderRadius:99, fontWeight:600 }}>現貨</span>
                  {qtyInCart && <span style={{ position:"absolute", top:6, right:6, background:C.accent, color:"#fff", fontSize:10, width:18, height:18, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>{qtyInCart}</span>}
                </div>
                <div style={{ padding:"8px 10px 10px" }}>
                  <div style={{ fontSize:11, lineHeight:1.4, color:C.text, marginBottom:6, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{sanitize(item.name)}</div>
                  <div style={{ fontSize:12, color:C.accent, fontWeight:600 }}>NT$ {item.price.toLocaleString()}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Sheet open={!!selected} onClose={() => setSelected(null)} title={selected ? sanitize(selected.name) : ""}>
        <ProductDetailSheet product={selected} allProducts={active} cart={cart} onAdd={onAdd} onClose={() => setSelected(null)} rate={rate} />
      </Sheet>
    </div>
  );
}

function CatalogTab({ products, rate, cart, onAdd }) {
  const [activeCategory, setActiveCategory] = useState("全部");
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [mName, setMName] = useState("");
  const [mPrice, setMPrice] = useState("");
  const inCart = id => cart.find(c => c.id === id);
  const active = products.filter(p => p.status === "on");
  const categories = ["全部", ...Array.from(new Set(active.map(p => p.category).filter(Boolean)))];
  const filtered = active
    .filter(p => activeCategory === "全部" || p.category === activeCategory)
    .filter(p => !search || sanitize(p.name).includes(search) || sanitize(p.category).includes(search));

  return (
    <div style={{ paddingBottom:20 }}>
      <div style={{ margin:"16px 12px", background:C.surface, borderRadius:20, padding:"20px 18px", boxShadow:"0 2px 16px rgba(0,0,0,.06)" }}>
        <div style={{ fontSize:10, color:C.muted, letterSpacing:1.5, textTransform:"uppercase", marginBottom:4 }}>SHOP</div>
        <div style={{ fontSize:22, fontWeight:700, color:C.text, marginBottom:4 }}>商品下單</div>
        <div style={{ fontSize:12, color:C.muted }}>選商品、規格與數量後直接送單。</div>
      </div>
      <div style={{ display:"flex", gap:8, overflowX:"auto", padding:"0 12px 12px", scrollbarWidth:"none" }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} style={{ padding:"7px 18px", borderRadius:99, fontSize:12, fontWeight:600, cursor:"pointer", border:`1.5px solid ${activeCategory===cat?C.accent:C.border}`, background:activeCategory===cat?C.accentBg:C.surface, color:activeCategory===cat?C.accent:C.muted, whiteSpace:"nowrap", flexShrink:0, transition:"all .15s" }}>{cat}</button>
        ))}
      </div>
      <div style={{ padding:"0 12px 14px", position:"relative" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜尋商品 / 分類"
          style={{ width:"100%", background:C.surface, border:`1.5px solid ${C.border}`, borderRadius:99, padding:"10px 16px 10px 40px", fontSize:13, color:C.text }}
          onFocus={e=>{ e.target.style.borderColor=C.accent; }} onBlur={e=>{ e.target.style.borderColor=C.border; }} />
        <span style={{ position:"absolute", left:26, top:"50%", transform:"translateY(-50%)", fontSize:15, color:C.faint }}>🔍</span>
        {search && <button onClick={()=>setSearch("")} style={{ position:"absolute", right:24, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:C.faint, fontSize:18, cursor:"pointer" }}>×</button>}
      </div>
      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"40px 0", color:C.faint, fontSize:13 }}>找不到商品</div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, padding:"0 12px" }}>
          {filtered.map((p, i) => {
            const qtyInCart = inCart(p.id)?.qty;
            return (
              <div key={p.id} className="appear" style={{ animationDelay:`${i*.025}s`, background:C.surface, borderRadius:14, overflow:"hidden", boxShadow:"0 1px 8px rgba(0,0,0,.06)", cursor:"pointer" }} onClick={() => setSelected(p)}>
                <div style={{ background:"#f5f0ea", aspectRatio:"1/1", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
                  {p.image && p.image.startsWith("data:") ? <img src={p.image} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    : p.image ? <span style={{ fontSize:36 }}>{p.image}</span>
                    : <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9l4-4 4 4 4-4 4 4"/><path d="M3 15l4 4 4-4 4 4 4-4"/></svg>}
                  {qtyInCart && <span style={{ position:"absolute", top:6, right:6, background:C.accent, color:"#fff", fontSize:10, width:18, height:18, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>{qtyInCart}</span>}
                </div>
                <div style={{ padding:"8px 10px 12px" }}>
                  <div style={{ fontSize:10, color:C.muted, marginBottom:2 }}>{sanitize(p.category)}</div>
                  <div style={{ fontSize:11, lineHeight:1.4, color:C.text, marginBottom:5, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{sanitize(p.name)}</div>
                  {p.price > 0 ? (
                    <><div style={{ fontSize:13, fontWeight:700, color:C.accent }}>NT$ {Math.round(p.price * rate).toLocaleString()}</div>
                    <div style={{ fontSize:10, color:C.faint }}>JPY {p.price.toLocaleString()}</div></>
                  ) : <div style={{ fontSize:11, color:C.muted }}>洽詢定價</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ margin:"20px 12px 0", background:C.surface, borderRadius:14, padding:"16px" }}>
        <div style={{ fontSize:12, color:C.muted, marginBottom:10 }}>找不到商品？手動填寫需求</div>
        {!showManual ? (
          <button onClick={() => setShowManual(true)} style={{ background:C.bgDeep, border:`1.5px solid ${C.border}`, borderRadius:99, padding:"8px 20px", fontSize:12, color:C.textMid, cursor:"pointer" }}>+ 手動輸入</button>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <Field label="商品名稱 *" value={mName} onChange={v=>setMName(v.slice(0,100))} placeholder="Nike Air Force 1 黑色 25cm" />
            <Field label="定價（NT$）" type="number" value={mPrice} onChange={setMPrice} placeholder="600" />
            {mPrice && <div style={{ fontSize:11, color:C.accent }}>NT$ {Number(mPrice).toLocaleString()}</div>}
            <div style={{ display:"flex", gap:8 }}>
              <Btn full onClick={() => { const n=sanitize(mName,100); if(!n) return; onAdd({ id:secureUid(), name:n, price:safePrice(mPrice), image:"", category:"手動輸入" }); setShowManual(false); setMName(""); setMPrice(""); }}>加入購物車</Btn>
              <Btn v="outline" sm onClick={() => setShowManual(false)}>取消</Btn>
            </div>
          </div>
        )}
      </div>
      <Sheet open={!!selected} onClose={() => setSelected(null)} title={selected ? sanitize(selected.name) : ""}>
        <ProductDetailSheet product={selected} allProducts={active} cart={cart} onAdd={onAdd} onClose={() => setSelected(null)} rate={rate} />
      </Sheet>
    </div>
  );
}


function OrdersTab({ orders }) {
  const STEPS = ["pending_review","pending","bought","shipped","arrived"];
  return (
    <div style={{ padding:"28px 20px 20px" }}>
      <SecHead en="My Orders" zh="我的訂單" />
      {!orders.length ? (
        <div style={{ textAlign:"center", padding:"56px 0", color:C.faint, fontSize:12, letterSpacing:1 }}>尚無訂單紀錄</div>
      ) : orders.map((o,i)=>(
        <div key={o.id} className="appear" style={{ animationDelay:`${i*.05}s` }}>
          <div style={{ padding:"20px 0" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
              <div>
                <div style={{ fontSize:14, letterSpacing:.4 }}>{o.items[0]?.name}{o.items.length>1?` 外 ${o.items.length-1} 項`:""}</div>
                <div style={{ fontSize:10, color:C.faint, marginTop:4, letterSpacing:.6 }}>#{o.no} · {o.createdAt}</div>
              </div>
              <StatusTag status={o.status} />
            </div>
            {o.status!=="cancelled" && (
              <div style={{ display:"flex", alignItems:"center", margin:"14px 0", gap:0 }}>
                {STEPS.map((s,si)=>{ const cur=STEPS.indexOf(o.status); const done=si<=cur; return (
                  <div key={s} style={{ display:"flex", alignItems:"center", flex:si<STEPS.length-1?1:0 }}>
                    <div style={{ width:7, height:7, borderRadius:"50%", background:done?C.accent:C.border, flexShrink:0 }} />
                    {si<STEPS.length-1 && <div style={{ flex:1, height:1, background:si<cur?C.accent:C.border }} />}
                  </div>
                ); })}
              </div>
            )}
            <div style={{ fontSize:11, color:C.muted, letterSpacing:.3 }}>{o.items.map(it=>`${it.name} × ${it.qty}`).join("  ·  ")}</div>
            <div style={{ marginTop:8, fontSize:13, color:C.text, fontWeight:400 }}>{fmtMoney(o.total)}</div>
          </div>
          {i<orders.length-1 && <HR />}
        </div>
      ))}
    </div>
  );
}

// ─── Member Center ────────────────────────────────────────────────
function MemberTab({ member, setMember, lineUser, wishes, onAddWish }) {
  const [editing, setEditing]         = useState(false);
  const [form, setForm]               = useState({ ...member });
  const [wishSheet, setWishSheet]     = useState(false);
  const [wishName, setWishName]       = useState("");
  const [wishNote, setWishNote]       = useState("");
  const [saved, setSaved]             = useState(false);
  const [formErr, setFormErr]         = useState("");

  const validateAndSave = () => {
    setFormErr("");
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setFormErr("Email 格式不正確"); return;
    }
    if (form.phone && !/^[\d\-+\s()]{7,20}$/.test(form.phone)) {
      setFormErr("手機格式不正確"); return;
    }
    setMember({ ...form, name:sanitize(form.name,50), phone:sanitize(form.phone,20), email:sanitize(form.email,100) });
    setEditing(false); setSaved(true);
    setTimeout(()=>setSaved(false), 2500);
  };

  const WISH_LABEL = { searching:"許願中", found:"已找到" };

  return (
    <div style={{ padding:"28px 20px 20px" }}>
      <SecHead en="Member Centre" zh="會員中心" />

      {/* Profile card */}
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, padding:"20px 18px", marginBottom:24, display:"flex", alignItems:"center", gap:16, boxShadow:C.shadow }}>
        <div style={{ width:48, height:48, background:C.bgDeep, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontFamily:"'Noto Serif TC',serif", fontSize:18, color:C.textMid }}>
          {member.name ? member.name[0] : "?"}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:"'Noto Serif TC',serif", fontSize:15, fontWeight:400, letterSpacing:.8, color:C.text, marginBottom:3 }}>
            {member.name || "（未設定姓名）"}
          </div>
          <div style={{ fontSize:10, color:C.faint, letterSpacing:.6 }}>
            LINE 已驗證 · {lineUser.name}
          </div>
        </div>
        <Btn sm v="outline" onClick={()=>{ setForm({...member}); setFormErr(""); setEditing(true); }}>
          <I k="edit" size={11}/> 編輯
        </Btn>
      </div>

      {/* Info list */}
      {!editing && (
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, marginBottom:24, boxShadow:C.shadow }}>
          {[
            { label:"姓　　名", value:member.name     },
            { label:"手　　機", value:member.phone    },
            { label:"生　　日", value:member.birthday },
            { label:"E-mail",  value:member.email    },
          ].map(({ label, value }, i, arr) => (
            <div key={label}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 18px" }}>
                <span style={{ fontSize:10, color:C.muted, letterSpacing:1, textTransform:"uppercase", fontWeight:500, minWidth:72 }}>{label}</span>
                <span style={{ fontSize:13, color:value?C.text:C.faint, letterSpacing:.3, textAlign:"right" }}>
                  {value || "—"}
                </span>
              </div>
              {i < arr.length-1 && <HR />}
            </div>
          ))}
        </div>
      )}

      {saved && (
        <div className="appear" style={{ background:C.greenBg, padding:"10px 16px", marginBottom:24, fontSize:11, color:C.green, letterSpacing:.6, display:"flex", alignItems:"center", gap:8 }}>
          <I k="check" size={12}/> 會員資料已儲存
        </div>
      )}

      {/* Wishlist */}
      <div style={{ marginTop:4 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ fontFamily:"'Noto Serif TC',serif", fontSize:14, fontWeight:400, letterSpacing:1.5, color:C.text }}>許願清單</div>
          <Btn sm v="outline" onClick={()=>setWishSheet(true)}>
            <I k="heart" size={11}/> 新增
          </Btn>
        </div>
        <HR />
        {!wishes.length ? (
          <div style={{ textAlign:"center", padding:"28px 0", color:C.faint, fontSize:11, letterSpacing:.8 }}>尚無許願</div>
        ) : wishes.map((w,i)=>(
          <div key={w.id}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0" }}>
              <div>
                <div style={{ fontSize:13, letterSpacing:.3, color:C.text }}>{w.name}</div>
                {w.note && <div style={{ fontSize:11, color:C.faint, marginTop:2, letterSpacing:.3 }}>{w.note}</div>}
              </div>
              <span style={{ fontSize:9, letterSpacing:.7, border:`1px solid ${w.status==="found"?C.green:C.border}`, color:w.status==="found"?C.green:C.muted, padding:"2px 8px", whiteSpace:"nowrap" }}>
                {WISH_LABEL[w.status]||"許願中"}
              </span>
            </div>
            {i<wishes.length-1 && <HR />}
          </div>
        ))}
      </div>

      {/* Edit Sheet */}
      <Sheet open={editing} onClose={()=>setEditing(false)} title="編輯會員資料">
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <Field label="姓名" value={form.name} onChange={v=>setForm(f=>({...f,name:v.slice(0,50)}))} placeholder="請輸入姓名" />
          <Field label="手機" type="tel" value={form.phone} onChange={v=>setForm(f=>({...f,phone:v.slice(0,20)}))} placeholder="0912-345-678" />
          <Field label="生日" type="date" value={form.birthday} onChange={v=>setForm(f=>({...f,birthday:v}))} />
          <Field label="Email" type="email" value={form.email} onChange={v=>setForm(f=>({...f,email:v.slice(0,100)}))} placeholder="example@mail.com" />

          <div style={{ background:C.bgDeep, padding:"12px 14px" }}>
            <div style={{ fontSize:10, color:C.muted, letterSpacing:.8, textTransform:"uppercase", marginBottom:4 }}>LINE 帳號（不可修改）</div>
            <div style={{ fontSize:12, color:C.faint }}>{lineUser.name}</div>
          </div>

          {formErr && <div style={{ fontSize:11, color:C.red, letterSpacing:.4 }}>⚠ {formErr}</div>}

          <div style={{ display:"flex", gap:8, paddingTop:4 }}>
            <Btn full onClick={validateAndSave}>儲存</Btn>
            <Btn full v="outline" onClick={()=>setEditing(false)}>取消</Btn>
          </div>
        </div>
      </Sheet>

      {/* Wish Sheet */}
      <Sheet open={wishSheet} onClose={()=>setWishSheet(false)} title="新增許願">
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <Field label="想找的商品 *" value={wishName} onChange={setWishName} placeholder="限定版茶杯組" />
          <Field label="備註（選填）" value={wishNote} onChange={setWishNote} placeholder="京都限定款、色號…" />
          <div style={{ fontSize:10, color:C.muted, letterSpacing:.5, lineHeight:2 }}>送出後業者會幫你留意，找到後會通知您。</div>
          <div style={{ display:"flex", gap:8, paddingTop:4 }}>
            <Btn full onClick={()=>{ onAddWish(wishName,wishNote); setWishSheet(false); setWishName(""); setWishNote(""); }}>送出許願</Btn>
            <Btn full v="outline" onClick={()=>setWishSheet(false)}>取消</Btn>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

// ─── LINE Notif Sheet ─────────────────────────────────────────────
function NotifSheet({ notif, onClose }) {
  const [step, setStep] = useState("sending");
  useState(()=>{ const t=setTimeout(()=>setStep("sent"),1800); return ()=>clearTimeout(t); });
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(28,28,26,.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:1000 }}>
      <div className="appear" style={{ width:"100%", maxWidth:480, background:C.surface, borderTop:`1px solid ${C.border}`, padding:"24px 20px 56px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
          <div style={{ width:40, height:40, background:step==="sent"?"#00b900":C.bgDeep, display:"flex", alignItems:"center", justifyContent:"center", transition:"background .5s" }}>
            {step==="sending"
              ? <span style={{ animation:"spin 1s linear infinite", display:"inline-block", color:C.muted }}>◌</span>
              : <I k="check" size={16} style={{ color:"#fff" }} />}
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:400, letterSpacing:.5 }}>{step==="sending"?"發送通知中…":"訂單已送出"}</div>
            <div style={{ fontSize:10, color:C.faint, marginTop:3, letterSpacing:.5 }}>訂單 #{notif.no}</div>
          </div>
        </div>
        {step==="sent" && (
          <div className="appear" style={{ background:C.bgDeep, padding:"14px 16px", marginBottom:20, borderLeft:`2px solid ${C.accent}` }}>
            <div style={{ fontSize:10, color:C.muted, letterSpacing:.8, marginBottom:8 }}>LINE 通知內容</div>
            <pre style={{ fontSize:12, color:C.textMid, lineHeight:2, whiteSpace:"pre-wrap", fontFamily:"'Noto Sans TC',sans-serif", letterSpacing:.3 }}>{
`訂單通知 #${notif.no}
客人：${notif.name}
${notif.items.map(it=>`· ${it.name} × ${it.qty}`).join("\n")}
合計：${fmtMoney(notif.total)}
狀態：待審核`}</pre>
          </div>
        )}
        <Btn full onClick={onClose} disabled={step==="sending"}>
          {step==="sending" ? "請稍候…" : "確認，前往訂單"}
        </Btn>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────
// ─── Register Page ────────────────────────────────────────────────
function RegisterPage({ lineUser, onComplete }) {
  const [form, setForm] = useState({
    community_name: "",
    email:          "",
    line_id:        "",
    ig_threads:     "",
    recipient_name: "",
    phone:          "",
    seven_store:    "",
  });
  const [errors, setErrors]   = useState({});
  const [saving, setSaving]   = useState(false);
  const [isEdit, setIsEdit]   = useState(false);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.community_name.trim()) e.community_name = "請填寫社群名稱";
    if (!form.email.trim())          e.email = "請填寫信箱";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "信箱格式不正確";
    if (!form.recipient_name.trim()) e.recipient_name = "請填寫收件人姓名";
    if (!form.phone.trim())          e.phone = "請填寫電話";
    if (!form.ig_threads.trim())     e.ig_threads = "請填寫 IG / Threads 帳號";
    if (!form.seven_store.trim())    e.seven_store = "請填寫 7-11 門市";
    return e;
  };

  const save = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    const memberData = {
      line_user_id:   lineUser.userId,
      line_name:      lineUser.name,
      community_name: sanitize(form.community_name, 100),
      email:          sanitize(form.email, 100),
      line_id:        sanitize(form.line_id, 100),
      ig_threads:     sanitize(form.ig_threads, 200),
      recipient_name: sanitize(form.recipient_name, 50),
      phone:          sanitize(form.phone, 20),
      seven_store:    sanitize(form.seven_store, 100),
      updated_at:     new Date().toISOString(),
    };
    try {
      const { error } = await supabase.from("members")
        .upsert([memberData], { onConflict: "line_user_id" });
      if (error) throw error;
      onComplete(memberData);
    } catch(err) {
      console.error(err);
      alert("儲存失敗，請稍後再試");
    }
    setSaving(false);
  };

  const FIELDS = [
    { key:"community_name", label:"社群名稱",        required:true,  placeholder:"例：曉曉代購團",    type:"text" },
    { key:"email",          label:"信箱",             required:true,  placeholder:"example@gmail.com",  type:"email" },
    { key:"line_id",        label:"LINE ID",          required:false, placeholder:"@yourlineid",        type:"text" },
    { key:"ig_threads",     label:"IG / Threads 連結", required:true,  placeholder:"https://www.instagram.com/xxx", type:"text" },
    { key:"recipient_name", label:"收件人姓名",        required:true,  placeholder:"王小明",             type:"text" },
    { key:"phone",          label:"電話",             required:true,  placeholder:"0912-345-678",        type:"tel" },
    { key:"seven_store",    label:"7-11 門市",         required:true,  placeholder:"台北市中正區博愛門市", type:"text" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start", padding:"32px 20px 60px" }}>
      {/* Header */}
      <div style={{ width:"100%", maxWidth:420, marginBottom:28, textAlign:"center" }}>
        <div style={{ fontFamily:"'IM Fell English',serif", fontStyle:"italic", fontSize:10, color:C.muted, letterSpacing:3, textTransform:"uppercase", marginBottom:10 }}>Member Registration</div>
        <div style={{ fontFamily:"'Noto Serif TC',serif", fontSize:22, fontWeight:300, letterSpacing:2, color:C.text, marginBottom:8 }}>
          {isEdit ? "編輯基本資料" : "填寫基本資料"}
        </div>
        <div style={{ fontSize:12, color:C.muted, lineHeight:2, letterSpacing:.4 }}>
          請填寫以下資料以完成註冊<br/>
          之後可在會員中心修改
        </div>
        <div style={{ width:28, height:1, background:C.borderMid, margin:"14px auto 0" }} />
      </div>

      {/* LINE info badge */}
      <div style={{ width:"100%", maxWidth:420, background:C.surface, border:`1px solid ${C.border}`, padding:"12px 16px", marginBottom:20, display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:36, height:36, background:"#00b900", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>💬</div>
        <div>
          <div style={{ fontSize:11, color:C.muted, letterSpacing:.5 }}>LINE 已驗證</div>
          <div style={{ fontSize:14, fontWeight:500, color:C.text, marginTop:2 }}>{lineUser.name}</div>
        </div>
      </div>

      {/* Form */}
      <div style={{ width:"100%", maxWidth:420, background:C.surface, border:`1px solid ${C.border}`, boxShadow:C.shadow }}>
        <div style={{ padding:"24px 20px", display:"flex", flexDirection:"column", gap:16 }}>
          {FIELDS.map(({ key, label, required, placeholder, type }) => (
            <div key={key} style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label style={{ fontSize:10, color:errors[key]?C.red:C.muted, fontWeight:500, letterSpacing:1, textTransform:"uppercase" }}>
                {label}{required && <span style={{ color:C.red }}> *</span>}
              </label>
              <input
                type={type}
                value={form[key]}
                onChange={e => { f(key, e.target.value); setErrors(p=>({...p,[key]:""})); }}
                placeholder={placeholder}
                maxLength={200}
                style={{
                  background:C.bg, border:`1px solid ${errors[key]?C.red:C.border}`,
                  padding:"10px 12px", color:C.text, fontSize:14, letterSpacing:.3,
                  transition:"border .15s, box-shadow .15s",
                }}
                onFocus={e=>{ e.target.style.borderColor=errors[key]?C.red:C.accent; e.target.style.boxShadow=`0 0 0 2px ${C.accent}15`; }}
                onBlur={e=>{ e.target.style.borderColor=errors[key]?C.red:C.border; e.target.style.boxShadow="none"; }}
              />
              {errors[key] && <div style={{ fontSize:11, color:C.red, letterSpacing:.3 }}>⚠ {errors[key]}</div>}
            </div>
          ))}

          {/* 必填提示 */}
          <div style={{ fontSize:11, color:C.faint, letterSpacing:.4, paddingTop:4, borderTop:`1px solid ${C.border}` }}>
            * 為必填欄位。您的資料僅用於訂單配送與聯絡用途。
          </div>

          <button onClick={save} disabled={saving} style={{
            background:saving?C.bgDeep:C.bgDark, color:saving?C.muted:"#f5f3ef",
            border:"none", padding:"13px 20px", fontSize:13, fontWeight:400,
            letterSpacing:.5, cursor:saving?"not-allowed":"pointer",
            transition:"opacity .15s", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          }}>
            {saving ? <><span style={{ animation:"spin 1s linear infinite", display:"inline-block" }}>◌</span> 儲存中…</> : "完成註冊，進入系統"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CustomerRoot() {
  injectStyles();
  const [lineUser, setLineUser] = useState(null);
  const [member, setMember]     = useState(null);   // null = 未載入, false = 未註冊, object = 已註冊
  const [data, setData]         = useState({ rate:0.26, products:[], inStock:[], orders:[], wishlist:[], announcements:[] });
  const [loading, setLoading]   = useState(false);

  // 登入後：1. 檢查是否已有會員資料  2. 載入頁面資料
  useEffect(() => {
    if (!lineUser) return;
    setLoading(true);

    Promise.all([
      // 檢查會員資料
      supabase.from("members").select("*").eq("line_user_id", lineUser.userId).single(),
      // 載入頁面資料
      supabase.from("products").select("*").eq("status","on").order("created_at",{ascending:false}),
      supabase.from("in_stock").select("*").eq("status","on").order("created_at",{ascending:false}),
      supabase.from("announcements").select("*").order("created_at",{ascending:false}),
      supabase.from("orders").select("*").eq("customer_line_id",lineUser.userId).order("created_at",{ascending:false}),
      supabase.from("wishlist").select("*").eq("customer_line_id",lineUser.userId).order("created_at",{ascending:false}),
      supabase.from("settings").select("*").eq("key","jpy_rate").single(),
    ]).then(([m, p, s, a, o, w, r]) => {
      // 設定會員資料（有資料就設定，沒有就 false 表示未註冊）
      setMember(m.data || false);
      setData({
        products:      p.data||[],
        inStock:       s.data||[],
        announcements: a.data||[],
        orders:        o.data||[],
        wishlist:      w.data||[],
        rate:          r.data ? Number(r.data.value) : 0.26,
      });
      setLoading(false);
    }).catch(() => setLoading(false));

    // 即時訂閱
    const sub = supabase
      .channel("customer-realtime")
      .on("postgres_changes", { event:"UPDATE", schema:"public", table:"orders", filter:`customer_line_id=eq.${lineUser.userId}` }, payload => {
        setData(d => ({ ...d, orders: d.orders.map(o => o.id===payload.new.id ? payload.new : o) }));
      })
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"products" }, payload => {
        if (payload.new.status === "on") setData(d => ({ ...d, products: [payload.new, ...d.products] }));
      })
      .on("postgres_changes", { event:"UPDATE", schema:"public", table:"products" }, payload => {
        setData(d => ({
          ...d,
          products: payload.new.status === "on"
            ? d.products.map(p => p.id===payload.new.id ? payload.new : p)
            : d.products.filter(p => p.id!==payload.new.id),
        }));
      })
      .on("postgres_changes", { event:"DELETE", schema:"public", table:"products" }, payload => {
        setData(d => ({ ...d, products: d.products.filter(p => p.id!==payload.old.id) }));
      })
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"in_stock" }, payload => {
        if (payload.new.status === "on") setData(d => ({ ...d, inStock: [payload.new, ...d.inStock] }));
      })
      .on("postgres_changes", { event:"UPDATE", schema:"public", table:"in_stock" }, payload => {
        setData(d => ({
          ...d,
          inStock: payload.new.status === "on"
            ? d.inStock.map(s => s.id===payload.new.id ? payload.new : s)
            : d.inStock.filter(s => s.id!==payload.new.id),
        }));
      })
      .on("postgres_changes", { event:"DELETE", schema:"public", table:"in_stock" }, payload => {
        setData(d => ({ ...d, inStock: d.inStock.filter(s => s.id!==payload.old.id) }));
      })
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"announcements" }, payload => {
        setData(d => ({ ...d, announcements: [payload.new, ...d.announcements] }));
      })
      .on("postgres_changes", { event:"UPDATE", schema:"public", table:"announcements" }, payload => {
        setData(d => ({ ...d, announcements: d.announcements.map(a => a.id===payload.new.id ? payload.new : a) }));
      })
      .on("postgres_changes", { event:"DELETE", schema:"public", table:"announcements" }, payload => {
        setData(d => ({ ...d, announcements: d.announcements.filter(a => a.id!==payload.old.id) }));
      })
      .on("postgres_changes", { event:"UPDATE", schema:"public", table:"wishlist", filter:`customer_line_id=eq.${lineUser.userId}` }, payload => {
        setData(d => ({ ...d, wishlist: d.wishlist.map(w => w.id===payload.new.id ? payload.new : w) }));
      })
      .subscribe();

    return () => sub.unsubscribe();
  }, [lineUser?.userId]);

  if (!lineUser) return <LineLogin onSuccess={setLineUser} />;

  if (loading) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
      <div style={{ fontSize:28, animation:"spin 1.2s linear infinite", display:"inline-block", color:C.muted }}>◌</div>
      <div style={{ fontSize:13, color:C.muted, letterSpacing:1 }}>載入中</div>
    </div>
  );

  // 未填寫資料 → 顯示註冊頁
  if (member === false) return (
    <RegisterPage lineUser={lineUser} onComplete={m => setMember(m)} />
  );

  return <MainApp lineUser={lineUser} member={member} setMember={setMember} data={data} setData={setData} />;
}
