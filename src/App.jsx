import { useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ─── 代購連線管理系統 ── 業者後台 ────────────────────────────────
const APP_NAME = "Muulie Studio";
const LOGO_SRC = "data:image/png;base64,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";

// ─── 奶茶色系 Korean Milk Tea ────────────────────────────────────
const C = {
  bg:        "#faf6f1",
  bgDeep:    "#f3ede4",
  bgDark:    "#2c1f14",
  surface:   "#fffdf9",
  border:    "#e8ddd0",
  borderSoft:"#ede5d8",
  text:      "#3a2e24",
  textMid:   "#7a6555",
  muted:     "#b0998a",
  faint:     "#d5c8ba",
  accent:    "#b5836a",
  accentDark:"#8f5f47",
  accentLight:"#d4a98a",
  accentBg:  "#f5ece3",
  green:     "#5a9e72",  greenBg:  "#edf5f0", greenDark:"#3d7a54",
  yellow:    "#c49a3c",  yellowBg: "#fdf6e3",
  red:       "#c06060",  redBg:    "#fdf0f0",
  blue:      "#6a8caf",  blueBg:   "#eef3f9",
  purple:    "#9b7fb6",  purpleBg: "#f5f0f9",
  orange:    "#d4894a",  orangeBg: "#fdf3eb",
  teal:      "#4a9e9e",  tealBg:   "#edf5f5",
  shadow:    "0 2px 16px rgba(90,60,30,0.08)",
  shadowMd:  "0 4px 28px rgba(90,60,30,0.12)",
  shadowLg:  "0 8px 40px rgba(90,60,30,0.16)",
};

const ORDER_STATUS = {
  pending_review: { label: "待審核",   color: C.blue,   bg: C.blueBg,   icon: "📋" },
  pending:        { label: "待採買",   color: C.amber,  bg: C.amberBg,  icon: "⏳" },
  bought:         { label: "已採買",   color: C.green,  bg: C.greenBg,  icon: "✅" },
  arrived:        { label: "已到台",   color: C.accent, bg: C.accentBg, icon: "📦" },
  shipped:        { label: "已寄出",   color: C.purple, bg: C.purpleBg, icon: "🚚" },
  cancelled:      { label: "已取消",   color: C.red,    bg: C.redBg,    icon: "❌" },
};

const uid = () => Math.random().toString(36).slice(2, 9);
const fmtMoney = (n) => `NT$${Number(n || 0).toLocaleString()}`;
const today = () => new Date().toLocaleDateString("zh-TW");

const INIT_DATA = {
  rate: 0.26,
  customers: [
    { id: "c1", name: "曉曉", phone: "0912-345-678", address: "台北市", level: "黃金" },
    { id: "c2", name: "Mina", phone: "0923-456-789", address: "新北市", level: "鑽石" },
    { id: "c3", name: "小雨", phone: "0934-567-890", address: "台中市", level: "白銀" },
  ],
  products: [
    { id: "p1", name: "高島屋土產代購", price: 0, image: "", status: "on", category: "土產/大型" },
    { id: "p2", name: "無印良品代購",   price: 0, image: "", status: "on", category: "生活" },
    { id: "p3", name: "藥妝代購",       price: 0, image: "", status: "on", category: "藥妝" },
    { id: "p4", name: "🇯🇵 7-11代購",   price: 0, image: "", status: "on", category: "便利商店" },
    { id: "p5", name: "吉伊卡哇手遊",   price: 0, image: "", status: "on", category: "玩具" },
  ],
  inStock: [
    { id: "s1", name: "Hello Kitty 鑰匙圈 草莓款", price: 350, image: "🎀", status: "on" },
    { id: "s2", name: "Sanrio 吊飾 新款",          price: 280, image: "⭐", status: "on" },
  ],
  orders: [
    { id: "o1", no: "7346", customerId: "c1", customerName: "曉曉", status: "cancelled",     items: [{ name: "🇯🇵 7-11代購",   cost: 32,   price: 39,   qty: 1, note: "" }], total: 39,   profit: 7,   createdAt: "2026-04-16" },
    { id: "o2", no: "7301", customerId: "c2", customerName: "Mina", status: "bought",        items: [{ name: "資生堂防曬乳",   cost: 560,  price: 728,  qty: 1, note: "" }], total: 728,  profit: 168, createdAt: "2026-04-14" },
    { id: "o3", no: "7298", customerId: "c3", customerName: "小雨", status: "pending_review",items: [{ name: "Nike Air Max 2024", cost: 3120, price: 3800, qty: 1, note: "白色 25cm" }], total: 3800, profit: 680, createdAt: "2026-04-13" },
  ],
  wishlist: [
    { id: "w1", customerId: "c1", customerName: "曉曉", name: "限定版茶杯組",   note: "京都限定款", status: "searching" },
    { id: "w2", customerId: "c2", customerName: "Mina", name: "Sanrio 吊飾 新款", note: "",         status: "found" },
  ],
  announcements: [
    { id: "an1", title: "第一天（4/21）行程公告", content: "🍒 藥妝 711 吉伊卡哇手遊 高島屋土產\n✨ 08:00 SUGI藥妝（美妝為主）\n大國藥妝（藥品為主）\n── 停留1小時 ──\n✨ 09:10 7-11（拍拍零食）\n── 停留30分鐘 ──\n✨ 09:45 唐吉軻德（拍照+採買）\n── 停留1小時 ──\n✨ 11:00 難波丸井百貨\n── 停留2.5小時 ──\n✨ 21:00 自由活動" }
  ],
};

// ─── Styles ──────────────────────────────────────────────────────
const injectStyles = () => {
  if (document.getElementById("ad-styles")) return;
  const s = document.createElement("style");
  s.id = "ad-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700;900&family=DM+Serif+Display:ital@0;1&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:${C.bg};color:${C.text};font-family:'Noto Sans TC',sans-serif;min-height:100vh}
    ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:${C.faint};border-radius:99px}
    input,select,textarea,button{font-family:inherit;outline:none}
    .fade{animation:fadeUp .3s cubic-bezier(.16,1,.3,1) both}
    @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
    .tab-ul{border-bottom:2px solid ${C.border};display:flex;overflow-x:auto;scrollbar-width:none}
    .tab-ul::-webkit-scrollbar{display:none}
    .tab-btn{padding:10px 16px;border:none;background:transparent;color:${C.muted};font-weight:600;font-size:14px;white-space:nowrap;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;transition:all .18s}
    .tab-btn.active{color:${C.accentDark};border-bottom-color:${C.accent}}
    .pill{display:inline-flex;align-items:center;gap:4px;padding:3px 11px;border-radius:99px;font-size:12px;font-weight:700}
    .row-hover:hover{background:${C.bgDeep}!important}
    @keyframes shakeX{0%,100%{transform:none}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
    @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
  `;
  document.head.appendChild(s);
};

// ─── Atoms ───────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const s = ORDER_STATUS[status] || ORDER_STATUS.pending;
  return <span className="pill" style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}25` }}>{s.icon} {s.label}</span>;
};

const Btn = ({ children, onClick, variant = "primary", sm, style: sx, disabled }) => {
  const v = {
    primary: { background: C.accent, color: "#fff", border: "none", boxShadow: `0 2px 8px ${C.accent}40` },
    soft:    { background: C.accentBg, color: C.accentDark, border: `1.5px solid ${C.accentLight}50` },
    ghost:   { background: "transparent", color: C.muted, border: `1.5px solid ${C.border}` },
    danger:  { background: C.redBg, color: C.red, border: `1.5px solid ${C.red}30` },
    success: { background: C.greenBg, color: C.greenDark, border: `1.5px solid ${C.green}30` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding: sm ? "6px 14px" : "10px 20px", borderRadius: 10, fontWeight: 600, fontSize: sm ? 13 : 14, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, transition: "all .16s", ...v[variant], ...sx }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.opacity = ".82"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
      onMouseLeave={e => { e.currentTarget.style.opacity = disabled ? ".5" : "1"; e.currentTarget.style.transform = "none"; }}
    >{children}</button>
  );
};

const Card = ({ children, style: sx }) => (
  <div className="fade" style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 18, padding: 18, boxShadow: C.shadow, ...sx }}>{children}</div>
);

const Input = ({ label, value, onChange, type = "text", placeholder, style: sx }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5, ...sx }}>
    {label && <label style={{ fontSize: 12, color: C.muted, fontWeight: 700, letterSpacing: .5, textTransform: "uppercase" }}>{label}</label>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "9px 13px", color: C.text, fontSize: 14 }}
      onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 3px ${C.accent}15`; }}
      onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
    />
  </div>
);

const Modal = ({ title, onClose, children, wide }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(58,46,36,.4)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}
    onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="fade" style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 22, boxShadow: C.shadowLg, width: "100%", maxWidth: wide ? 680 : 480, maxHeight: "92vh", overflow: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 0" }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'DM Serif Display',serif", color: C.accentDark }}>{title}</h3>
        <button onClick={onClose} style={{ background: C.bgDeep, border: "none", color: C.muted, width: 30, height: 30, borderRadius: "50%", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  </div>
);

const Toast = ({ msg, onDone }) => {
  useState(() => { const t = setTimeout(onDone, 2400); return () => clearTimeout(t); });
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: C.accentDark, color: "#fff", padding: "12px 24px", borderRadius: 14, fontWeight: 600, fontSize: 14, boxShadow: C.shadowMd, zIndex: 2000, animation: "fadeUp .2s ease", whiteSpace: "nowrap" }}>✓ {msg}</div>
  );
};

// ─── Security Layer ───────────────────────────────────────────────
// Crypto-grade UID using Web Crypto API
const secureUid = () => {
  const arr = new Uint8Array(9);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(36).padStart(2, "0")).join("").slice(0, 12);
};

// Hash password with SHA-256 (async, returns hex string)
const hashPassword = async (pw) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
};

// Simple XSS sanitizer — strips HTML tags from user input
const sanitize = (str) => String(str).replace(/<[^>]*>/g, "").replace(/[<>"'`]/g, "").trim();

// Validate allowed status values to prevent injection
const ALLOWED_STATUSES = new Set(["pending_review","pending","bought","shipped","arrived","cancelled"]);
const safeStatus = (s) => ALLOWED_STATUSES.has(s) ? s : "pending_review";

// Rate limiter — tracks failed attempts per session
const createRateLimiter = (maxAttempts = 5, lockoutMs = 5 * 60 * 1000) => {
  let attempts = 0;
  let lockedUntil = 0;
  let warningShown = false;
  return {
    check() {
      if (Date.now() < lockedUntil) {
        const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
        return { ok: false, locked: true, remaining, attempts };
      }
      return { ok: true, locked: false, remaining: 0, attempts };
    },
    fail() {
      attempts++;
      if (attempts >= maxAttempts) {
        lockedUntil = Date.now() + lockoutMs;
        attempts = 0; // reset after lockout
        return { locked: true, remaining: Math.ceil(lockoutMs / 1000) };
      }
      return { locked: false, remaining: 0, attemptsLeft: maxAttempts - attempts };
    },
    succeed() { attempts = 0; lockedUntil = 0; },
  };
};

// Session timeout — auto logout after 30 minutes of inactivity
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
let sessionTimer = null;
const resetSessionTimer = (onExpire) => {
  clearTimeout(sessionTimer);
  sessionTimer = setTimeout(() => { clearTimeout(sessionTimer); onExpire(); }, SESSION_TIMEOUT_MS);
};

// Audit log — records sensitive actions in memory
const auditLog = [];
const logAction = (action, detail = "") => {
  auditLog.unshift({
    id: Math.random().toString(36).slice(2),
    action, detail,
    time: new Date().toLocaleString("zh-TW"),
    ts: Date.now(),
  });
  if (auditLog.length > 100) auditLog.pop(); // cap at 100 entries
};

// Global rate limiter instance
const loginLimiter = createRateLimiter(5, 5 * 60 * 1000);

// ─── Export CSV ───────────────────────────────────────────────────
function exportCSV(orders, filename) {
  const header = [
    "訂單號","訂單日期","社群名稱","商品","規格","數量","成本","售價","利潤",
    "國際運費","收款日期","出貨日期","付款方式","後五碼","是否已收款","狀態"
  ];
  // 每個品項分一行
  const rows = [];
  orders.forEach(o => {
    const name = o.community_name || o.customer_name || o.customerName || "";
    const date = o.created_at ? new Date(o.created_at).toLocaleDateString("zh-TW") : (o.createdAt || "");
    const items = o.items || [];
    if (items.length === 0) {
      rows.push(["#"+sanitize(o.no), date, sanitize(name), "", "", 0, 0, o.total||0, o.profit||0, "", o.payment_date||"", o.ship_date||"", o.payment_method||"", o.bank_code||"", o.paid?"是":"否", ORDER_STATUS[o.status]?.label||o.status]);
    } else {
      items.forEach((it, idx) => {
        rows.push([
          idx === 0 ? "#"+sanitize(o.no) : "",
          idx === 0 ? date : "",
          idx === 0 ? sanitize(name) : "",
          sanitize((it.name||"").split(" / ")[0] || ""),
          sanitize((it.name||"").split(" / ").slice(1).join(" / ") || it.spec || it.note || ""),
          it.qty || 1,
          (it.cost || 0) * (it.qty || 1),
          (it.price || 0) * (it.qty || 1),
          ((it.price || 0) - (it.cost || 0)) * (it.qty || 1),
          idx === 0 ? (o.shipping_fee || "") : "",
          idx === 0 ? (o.payment_date || "") : "",
          idx === 0 ? (o.ship_date || "") : "",
          idx === 0 ? (o.payment_method === "transfer" ? "匯款" : o.payment_method === "cod" ? "貨到付款" : "") : "",
          idx === 0 ? (o.bank_code || "") : "",
          idx === 0 ? (o.paid ? "是" : "否") : "",
          idx === 0 ? (ORDER_STATUS[o.status]?.label || o.status) : "",
        ]);
      });
    }
  });
  const q = '"';
  const csv = [header, ...rows].map(r => r.map(v => (q+String(v||"").replace(new RegExp(q,"g"),q+q)+q)).join(",")).join("\n");
  const blob = new Blob(["\uFEFF"+csv], {type:"text/csv;charset=utf-8;"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename || ("訂單匯出_"+new Date().toLocaleDateString("zh-TW").replace(/\//g,"-")+".csv");
  a.click();
  logAction("匯出CSV", "匯出 "+orders.length+" 筆訂單");
}

// ─── Login ────────────────────────────────────────────────────────
function LoginPage({ credentials, onSuccess }) {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [lockInfo, setLockInfo] = useState({ locked: false, remaining: 0, attemptsLeft: 5 });
  const [loading, setLoading] = useState(false);

  useState(() => {
    const interval = setInterval(() => {
      const s = loginLimiter.check();
      if (s.locked) { setLockInfo({ locked: true, remaining: s.remaining, attemptsLeft: 0 }); }
      else if (lockInfo.locked) { setLockInfo(prev => ({ ...prev, locked: false })); setError(""); }
    }, 1000);
    return () => clearInterval(interval);
  });

  const login = async () => {
    if (loading) return;
    const check = loginLimiter.check();
    if (check.locked) { setError(`帳號已鎖定，請等待 ${check.remaining} 秒後再試`); return; }
    const cleanAccount = sanitize(account);
    if (!cleanAccount || !password) { setError("請填寫帳號與密碼"); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 400 + Math.random() * 200));
    const pwHash = await hashPassword(password);
    const expectedHash = await hashPassword(credentials.password);
    if (cleanAccount === credentials.account && pwHash === expectedHash) {
      loginLimiter.succeed(); logAction("登入成功", `帳號：${cleanAccount}`);
      setLoading(false); onSuccess();
    } else {
      const result = loginLimiter.fail(); logAction("登入失敗", `帳號嘗試：${cleanAccount}`);
      setShake(true); setTimeout(() => setShake(false), 500);
      if (result.locked) { setError("嘗試次數過多，帳號已鎖定 5 分鐘"); setLockInfo({ locked: true, remaining: 300, attemptsLeft: 0 }); }
      else { setError(`帳號或密碼錯誤（剩餘 ${result.attemptsLeft} 次機會）`); setLockInfo(prev => ({ ...prev, attemptsLeft: result.attemptsLeft })); }
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:20, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"fixed", top:-80, right:-80, width:260, height:260, borderRadius:"50%", background:`${C.accentLight}25`, pointerEvents:"none" }} />
      <div style={{ position:"fixed", bottom:-60, left:-60, width:200, height:200, borderRadius:"50%", background:`${C.yellow}15`, pointerEvents:"none" }} />

      <div className="fade" style={{ width:"100%", maxWidth:400, background:C.surface, border:`1.5px solid ${C.border}`, borderRadius:24, boxShadow:C.shadowLg, overflow:"hidden", animation:shake?"shakeX .4s ease":undefined }}>
        <div style={{ background:`linear-gradient(135deg, ${C.accentDark}, ${C.accent})`, padding:"32px 28px 28px", textAlign:"center" }}>
          <img src={LOGO_SRC} alt="Muulie Studio" style={{ width:90, height:90, objectFit:"contain", marginBottom:10, filter:"brightness(0) invert(1)", opacity:.92 }} />
          <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:22, color:"#fff", fontWeight:700 }}>{APP_NAME}</div>
          <div style={{ color:"rgba(255,255,255,.75)", fontSize:13, marginTop:4 }}>業者管理後台</div>
        </div>
        <div style={{ padding:"28px 28px 24px", display:"flex", flexDirection:"column", gap:16 }}>
          {lockInfo.locked && (
            <div style={{ background:"#fff0f0", border:`1.5px solid ${C.red}`, borderRadius:12, padding:"14px 16px", display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ fontSize:22 }}>🔒</div>
              <div>
                <div style={{ fontWeight:700, color:C.red, fontSize:14 }}>帳號暫時鎖定</div>
                <div style={{ fontSize:13, color:C.red, marginTop:2 }}>{lockInfo.remaining > 0 ? `請等待 ${lockInfo.remaining} 秒後再試` : "正在計算…"}</div>
              </div>
            </div>
          )}
          {!lockInfo.locked && lockInfo.attemptsLeft < 5 && lockInfo.attemptsLeft > 0 && (
            <div style={{ background:C.yellowBg, border:`1.5px solid ${C.yellow}30`, borderRadius:10, padding:"10px 14px", fontSize:13, color:C.yellow, fontWeight:600 }}>
              ⚠️ 剩餘 {lockInfo.attemptsLeft} 次登入機會
            </div>
          )}
          <Input label="帳號" value={account} onChange={v => { setAccount(sanitize(v)); setError(""); }} placeholder="輸入管理員帳號" />
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <label style={{ fontSize:12, color:C.muted, fontWeight:700, letterSpacing:.5, textTransform:"uppercase" }}>密碼</label>
            <div style={{ position:"relative" }}>
              <input type={showPw?"text":"password"} value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={e => e.key==="Enter" && !lockInfo.locked && login()}
                placeholder="輸入密碼" disabled={lockInfo.locked||loading} maxLength={128} autoComplete="current-password"
                style={{ width:"100%", background:lockInfo.locked?C.bgDeep:C.bg, border:`1.5px solid ${error?C.red:C.border}`, borderRadius:10, padding:"9px 40px 9px 13px", color:C.text, fontSize:14, cursor:lockInfo.locked?"not-allowed":"text" }}
                onFocus={e => { if (!error) { e.target.style.borderColor=C.accent; e.target.style.boxShadow=`0 0 0 3px ${C.accent}15`; } }}
                onBlur={e => { e.target.style.borderColor=error?C.red:C.border; e.target.style.boxShadow="none"; }}
              />
              <button onClick={()=>setShowPw(p=>!p)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:C.muted, fontSize:16, cursor:"pointer" }}>{showPw?"🙈":"👁"}</button>
            </div>
          </div>
          {error && <div style={{ background:C.redBg, border:`1.5px solid ${C.red}30`, borderRadius:10, padding:"10px 14px", fontSize:13, color:C.red, fontWeight:600 }}>⚠️ {error}</div>}
          <Btn onClick={login} disabled={lockInfo.locked||loading} style={{ width:"100%", display:"flex", justifyContent:"center", alignItems:"center", gap:8, marginTop:4 }}>
            {loading ? <><span style={{ animation:"spin 1s linear infinite", display:"inline-block" }}>⟳</span> 驗證中…</> : lockInfo.locked ? "🔒 已鎖定" : "登入後台"}
          </Btn>
          <div style={{ fontSize:11, color:C.muted, textAlign:"center", lineHeight:1.6, marginTop:4, padding:"10px 0 0", borderTop:`1px solid ${C.border}` }}>
            🛡️ 連續錯誤 5 次將鎖定 5 分鐘<br/>登入後 30 分鐘無操作將自動登出
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────
function AdminDashboard({ data, setData, credentials, setCredentials, onLogout }) {
  const [tab, setTab] = useState("orders");
  const [toast, setToast] = useState(null);
  const showToast = useCallback(msg => setToast(msg), []);

  // ── Session timeout ──────────────────────────────────────────
  const [sessionWarning, setSessionWarning] = useState(false);
  const WARNING_MS = 25 * 60 * 1000; // warn at 25 min
  const TIMEOUT_MS = 30 * 60 * 1000; // logout at 30 min

  useState(() => {
    let warnTimer = setTimeout(() => setSessionWarning(true), WARNING_MS);
    let logoutTimer = setTimeout(() => {
      logAction("Session 逾時自動登出");
      onLogout();
    }, TIMEOUT_MS);

    const reset = () => {
      clearTimeout(warnTimer); clearTimeout(logoutTimer);
      setSessionWarning(false);
      warnTimer   = setTimeout(() => setSessionWarning(true), WARNING_MS);
      logoutTimer = setTimeout(() => { logAction("Session 逾時自動登出"); onLogout(); }, TIMEOUT_MS);
    };

    const events = ["click", "keydown", "mousemove", "touchstart"];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    logAction("登入後台");

    return () => {
      clearTimeout(warnTimer); clearTimeout(logoutTimer);
      events.forEach(e => window.removeEventListener(e, reset));
    };
  });

  // ── 從 Supabase 載入資料 + 即時訂閱 ─────────────────────────
  useState(() => {
    Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("in_stock").select("*").order("created_at", { ascending: false }),
      supabase.from("announcements").select("*").order("created_at", { ascending: false }),
      supabase.from("wishlist").select("*").order("created_at", { ascending: false }),
      supabase.from("members").select("*"),
    ]).then(([o, p, s, a, w, m]) => {
      setData(d => ({
        ...d,
        orders:        o.data || [],
        products:      p.data || [],
        inStock:       s.data || [],
        announcements: a.data || [],
        wishlist:      w.data || [],
        members:       m.data || [],
      }));
    }).catch(err => console.error("Supabase 載入失敗", err));

    // 即時訂閱新訂單
    const sub = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, payload => {
        setData(d => ({ ...d, orders: [payload.new, ...d.orders] }));
        showToast(`🔔 新訂單！${payload.new.customer_name} #${payload.new.no}`);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, payload => {
        setData(d => ({ ...d, orders: d.orders.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o) }));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "wishlist" }, payload => {
        setData(d => ({ ...d, wishlist: [payload.new, ...d.wishlist] }));
        showToast(`⭐ ${payload.new.customer_name} 許願了「${payload.new.name}」`);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "wishlist" }, payload => {
        setData(d => ({ ...d, wishlist: d.wishlist.map(w => w.id === payload.new.id ? payload.new : w) }));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "wishlist" }, payload => {
        setData(d => ({ ...d, wishlist: d.wishlist.filter(w => w.id !== payload.old.id) }));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "orders" }, payload => {
        setData(d => ({ ...d, orders: d.orders.filter(o => o.id !== payload.old.id) }));
      })
      .subscribe();

    return () => sub.unsubscribe();
  });

  // ── LINE 推播通知 ───────────────────────────────────────────
  const sendLineNotify = async (lineUserIds, message) => {
    if (!lineUserIds || lineUserIds.length === 0) { showToast("找不到客人 LINE ID"); return; }
    if (!message.trim()) { showToast("請填寫通知內容"); return; }
    try {
      const res = await fetch(
        `https://pdvoxaluahzjnhvtirdi.supabase.co/functions/v1/send-line`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ to: lineUserIds, message }),
        }
      );
      const result = await res.json();
      const success = result.results?.filter(r => r.ok).length || 0;
      const fail = result.results?.filter(r => !r.ok).length || 0;
      showToast(`✅ 已發送 ${success} 人${fail > 0 ? `，${fail} 人失敗` : ""}`);
    } catch (e) {
      console.error(e);
      showToast("發送失敗，請確認 Edge Function 設定");
    }
  };

  const totalOrders = data.orders.length;
  const pendingBuy  = data.orders.filter(o => o.status === "pending").length;
  const bought      = data.orders.filter(o => o.status === "bought").length;
  const profit      = data.orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + (o.profit||0), 0);

  // ── 統計卡片點擊篩選 ─────────────────────────────────────────
  const [orderFilter, setOrderFilter] = useState("all");
  const goFilter = (status) => {
    setOrderFilter(status);
    setTab("orders");
  };

  const TABS = [
    { id: "orders",        label: "訂單管理" },
    { id: "catalog",       label: "賣場管理" },
    { id: "instock",       label: "🏪 現貨" },
    { id: "wishlist",      label: "許願清單" },
    { id: "customers",     label: "客人管理" },
    { id: "archive",       label: "📦 封存" },
    { id: "settings",      label: "🔐 帳號設定" },
    { id: "auditlog",      label: "🛡️ 操作日誌" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      {/* Session warning banner */}
      {sessionWarning && (
        <div style={{ background: C.yellow, color: "#fff", padding: "10px 20px", textAlign: "center", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          ⏰ 已閒置 25 分鐘，5 分鐘後將自動登出
          <button onClick={() => { setSessionWarning(false); }} style={{ background: "rgba(255,255,255,.3)", border: "none", color: "#fff", padding: "4px 12px", borderRadius: 99, fontWeight: 700, cursor: "pointer", fontSize: 12 }}>繼續工作</button>
        </div>
      )}

      {/* Top bar */}
      <div style={{ background: C.surface, borderBottom: `1.5px solid ${C.border}`, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: sessionWarning ? 45 : 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={LOGO_SRC} alt="logo" style={{ width:38, height:38, objectFit:"contain" }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.accentDark, fontFamily: "'DM Serif Display',serif" }}>{APP_NAME}</div>
            <div style={{ fontSize: 11, color: C.muted }}>登入：{credentials.account}</div>
          </div>
        </div>
        <Btn sm variant="danger" onClick={() => { logAction("手動登出"); onLogout(); }}>登出</Btn>
      </div>

      {/* Tabs */}
      <div className="tab-ul" style={{ padding: "0 16px", background: C.surface, position: "sticky", top: sessionWarning ? 114 : 69, zIndex: 40 }}>
        {TABS.map(t => <button key={t.id} className={`tab-btn${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>)}
      </div>

      {/* Stats — 點擊可篩選訂單 */}
      <div style={{ padding: "16px 16px 8px", display: "flex", gap: 10 }}>
        {[
          { icon: "📋", val: totalOrders,  label: "總訂單",   filter: "all",     color: C.text   },
          { icon: "⏳", val: pendingBuy,   label: "待購買",   filter: "pending", color: C.orange },
          { icon: "✅", val: bought,       label: "已採買",   filter: "bought",  color: C.green  },
          { icon: "💰", val: `NT$${profit.toLocaleString()}`, label: "預估利潤", filter: null, color: C.accent },
        ].map((s, i) => {
          const isActive = s.filter && tab === "orders" && orderFilter === s.filter;
          return (
            <div key={i}
              onClick={() => s.filter && goFilter(s.filter)}
              style={{
                flex: 1, background: isActive ? C.accentBg : C.surface,
                border: `1.5px solid ${isActive ? C.accent : C.border}`,
                borderRadius: 14, padding: "12px 8px", textAlign: "center",
                boxShadow: isActive ? C.shadowMd : C.shadow,
                cursor: s.filter ? "pointer" : "default",
                transition: "all .18s",
                transform: isActive ? "translateY(-2px)" : "none",
              }}
              onMouseEnter={e => { if(s.filter) e.currentTarget.style.boxShadow = C.shadowMd; }}
              onMouseLeave={e => { if(s.filter) e.currentTarget.style.boxShadow = isActive ? C.shadowMd : C.shadow; }}
            >
              <div style={{ fontSize: 18 }}>{s.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: s.color, fontFamily: "'DM Serif Display',serif", marginTop: 2 }}>{s.val}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{s.label}</div>
              {s.filter && <div style={{ fontSize: 9, color: isActive ? C.accent : C.faint, marginTop: 3, fontWeight: 600 }}>{isActive ? "▲ 篩選中" : "點擊篩選"}</div>}
            </div>
          );
        })}
      </div>

      {/* Page content */}
      <div style={{ padding: "8px 16px 60px" }}>
        {tab === "orders"        && <OrdersPage        data={data} setData={setData} toast={showToast} initialFilter={orderFilter} onFilterChange={setOrderFilter} />}
        {tab === "review"        && <ReviewPage        data={data} setData={setData} toast={showToast} />}
        {tab === "catalog"       && <CatalogPage       data={data} setData={setData} toast={showToast} />}
        {tab === "instock"       && <InStockPage       data={data} setData={setData} toast={showToast} />}
        {tab === "wishlist"      && <WishlistPage      data={data} setData={setData} toast={showToast} />}
        {tab === "customers"     && <CustomersPage     data={data} setData={setData} toast={showToast} sendLineNotify={sendLineNotify} />}
        {tab === "settings"      && <SettingsPage      credentials={credentials} setCredentials={setCredentials} toast={showToast} onLogout={onLogout} />}
        {tab === "archive"       && <ArchivePage data={data} setData={setData} toast={showToast} />}
        {tab === "auditlog"      && <AuditLogPage />}
      </div>

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

// ─── Pages ───────────────────────────────────────────────────────
function OrdersPage({ data, setData, toast, initialFilter = "all", onFilterChange }) {
  const [filter, setFilter] = useState(initialFilter);
  const [showAdd, setShowAdd] = useState(false);
  const STATUS_KEYS = ["all","pending_review","pending","bought","shipped","arrived","cancelled"];
  const uniqueOrders = Array.from(new Map(data.orders.map(o => [o.id, o])).values());
  const filtered = uniqueOrders.filter(o => !o.archived).filter(o => filter === "all" || o.status === filter);

  // 同步外部篩選（統計卡片點擊）
  useState(() => { setFilter(initialFilter); }, [initialFilter]);

  const changeFilter = (s) => {
    setFilter(s);
    if (onFilterChange) onFilterChange(s);
  };

  const updateStatus = async (id, status) => {
    const safeS = safeStatus(status);
    const o = data.orders.find(x => x.id === id);
    const { error } = await supabase.from("orders").update({ status: safeS, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast("更新失敗"); return; }
    setData(d => ({ ...d, orders: d.orders.map(o => o.id === id ? { ...o, status: safeS } : o) }));
    logAction("更新訂單狀態", `#${o?.no} → ${ORDER_STATUS[safeS]?.label}`);
    toast("狀態已更新");
  };
  const del = async (id) => {
    if (!window.confirm("確定刪除？")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) { toast("刪除失敗"); return; }
    setData(d => ({ ...d, orders: d.orders.filter(o => o.id !== id) }));
    toast("已刪除");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: C.accentDark }}>
          訂單管理
          {filter !== "all" && (
            <span style={{ marginLeft:8, fontSize:12, color:C.accent, fontWeight:600 }}>
              — {ORDER_STATUS[filter]?.label}（{filtered.length} 筆）
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn sm variant="success" onClick={() => { exportCSV(data.orders); toast("CSV 已匯出 📊"); }}>📊 匯出 CSV</Btn>
          <Btn sm onClick={() => setShowAdd(true)}>＋ 新增訂單</Btn>
        </div>
      </div>

      {/* 篩選按鈕列 */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {STATUS_KEYS.map(s => {
          const count = s === "all" ? data.orders.length : data.orders.filter(o => o.status === s).length;
          const isActive = filter === s;
          return (
            <button key={s} onClick={() => changeFilter(s)} style={{
              padding: "6px 14px", borderRadius: 99,
              border: `1.5px solid ${isActive ? C.accent : C.border}`,
              background: isActive ? C.accentBg : "transparent",
              color: isActive ? C.accentDark : C.muted,
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              transition: "all .15s",
            }}>
              {s === "all" ? "全部" : ORDER_STATUS[s]?.label}
              <span style={{ marginLeft:5, fontSize:11, opacity:.7 }}>({count})</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card style={{ textAlign:"center", padding:32, color:C.muted }}>
          <div style={{ fontSize:32, marginBottom:8 }}>📭</div>
          <div>此狀態沒有訂單</div>
          <Btn sm variant="ghost" style={{ marginTop:12 }} onClick={() => changeFilter("all")}>顯示全部</Btn>
        </Card>
      )}
      {filtered.map(o => <OrderCard key={o.id} o={o} updateStatus={updateStatus} del={del} setData={setData} toast={toast} />)}
      {showAdd && <AddOrderModal data={data} setData={setData} onClose={() => setShowAdd(false)} toast={toast} />}
    </div>
  );
}

// ─── 訂單卡片元件 ────────────────────────────────────────────────
function OrderCard({ o, updateStatus, del, setData, toast }) {
  const [expanded, setExpanded] = useState(false);

  const cost = (o.items||[]).reduce((s,it)=>s+(it.cost||0)*(it.qty||1),0);
  const total = o.total || 0;
  const deposit = Number(o.deposit) || 0;
  const shippingFee = Number(o.shipping_fee) || 0;
  const finalPayment = Math.max(0, total + shippingFee - deposit);
  const totalPaid = (o.deposit_paid ? deposit : 0) + (o.final_paid ? finalPayment : 0);
  const totalUnpaid = total + shippingFee - totalPaid;
  const orderDate = o.created_at ? new Date(o.created_at).toLocaleDateString("zh-TW") : (o.createdAt||"");

  // 付款狀態標籤
  const payStatus = () => {
    if (o.final_paid) return { label:"尾款已付", color:C.green, bg:C.greenBg };
    if (o.deposit_paid) return { label:"已付訂金", color:C.accent, bg:C.accentBg };
    return { label:"未付款", color:C.amber, bg:C.amberBg };
  };
  const ps = payStatus();

  return (
    <div style={{ background:C.surface, borderRadius:16, border:`1.5px solid ${C.border}`, overflow:"hidden", boxShadow:C.shadow }}>
      {/* ── 訂單頭部（點擊展開） ── */}
      <div style={{ padding:"13px 14px", cursor:"pointer" }} onClick={()=>setExpanded(v=>!v)}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
              <span style={{ fontSize:11, color:C.muted }}>#{o.no}</span>
              <span style={{ fontSize:11, color:C.muted }}>·</span>
              <span style={{ fontSize:11, color:C.muted }}>{orderDate}</span>
            </div>
            <div style={{ fontWeight:700, fontSize:14, color:C.text, marginBottom:4 }}>
              {o.customer_name||o.customerName}
            </div>
            <div style={{ fontSize:12, color:C.muted }}>
              {(o.items||[])[0]?.name}{(o.items||[]).length > 1 ? ` 等 ${(o.items||[]).length} 件` : ""}
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5 }}>
            <StatusBadge status={o.status}/>
            <span style={{ fontSize:11, padding:"2px 8px", borderRadius:99, background:ps.bg, color:ps.color, fontWeight:600 }}>{ps.label}</span>
            <span style={{ fontSize:14, fontWeight:700, color:C.accentDark }}>{fmtMoney(total)}</span>
          </div>
        </div>
        {/* 展開箭頭 */}
        <div style={{ textAlign:"center", marginTop:4, fontSize:11, color:C.faint }}>
          {expanded ? "▲ 收起" : "▼ 展開詳情"}
        </div>
      </div>

      {/* ── 展開詳情 ── */}
      {expanded && (
        <div style={{ borderTop:`1px solid ${C.borderLight}` }}>

          {/* 區塊一：訂單概覽 */}
          <div style={{ padding:"14px 14px 10px", background:C.bgDeep }}>
            <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:10, letterSpacing:.5 }}>訂單概覽</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[
                { label:"訂單編號", value:`#${o.no}` },
                { label:"客人", value:o.customer_name||o.customerName||"" },
                { label:"訂單狀態", value:<StatusBadge status={o.status}/> },
                { label:"付款狀態", value:<span style={{ fontSize:11, padding:"2px 8px", borderRadius:99, background:ps.bg, color:ps.color, fontWeight:600 }}>{ps.label}</span> },
                { label:"總金額", value:fmtMoney(total+shippingFee), bold:true },
                { label:"已付款", value:fmtMoney(totalPaid), color:C.green },
                { label:"未付款", value:fmtMoney(Math.max(0,totalUnpaid)), color:totalUnpaid>0?C.red:C.green },
                { label:"下單日期", value:orderDate },
              ].map(item=>(
                <div key={item.label} style={{ display:"flex", flexDirection:"column", gap:2 }}>
                  <span style={{ fontSize:10, color:C.faint }}>{item.label}</span>
                  <span style={{ fontSize:13, fontWeight:item.bold?700:500, color:item.color||C.text }}>{item.value}</span>
                </div>
              ))}
            </div>
            {/* 狀態更改 */}
            <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:11, color:C.muted }}>更改狀態：</span>
              <select value={o.status} onChange={e=>{ e.stopPropagation(); updateStatus(o.id, e.target.value); }}
                style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"5px 8px", fontSize:12, cursor:"pointer" }}>
                {Object.entries(ORDER_STATUS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          {/* 區塊二：商品明細 */}
          <div style={{ padding:"14px" }}>
            <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:10, letterSpacing:.5 }}>商品明細</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {(o.items||[]).map((it,idx)=>(
                <div key={idx} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", background:C.bgDeep, borderRadius:10 }}>
                  <div style={{ width:36, height:36, borderRadius:8, background:C.surface, flexShrink:0, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>
                    {it.image?.startsWith("data:")||it.image?.startsWith("http")
                      ?<img src={it.image} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>e.target.style.display="none"}/>
                      :it.image||"🛒"}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:500 }}>{it.name}</div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>×{it.qty}</div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:C.accentDark }}>{fmtMoney((it.price||0)*(it.qty||1))}</div>
                    <div style={{ fontSize:11, color:C.muted }}>成本 {fmtMoney((it.cost||0)*(it.qty||1))}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* 小計 */}
            <div style={{ marginTop:10, padding:"10px 12px", background:C.bgDeep, borderRadius:10, display:"flex", flexDirection:"column", gap:4 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.muted }}>
                <span>商品小計</span><span>{fmtMoney(total)}</span>
              </div>
              {shippingFee>0&&<div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.muted }}>
                <span>國際運費</span><span>{fmtMoney(shippingFee)}</span>
              </div>}
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.muted }}>
                <span>成本</span><span>{fmtMoney(cost)}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, fontWeight:700, color:C.green, borderTop:`1px solid ${C.border}`, paddingTop:6, marginTop:2 }}>
                <span>利潤</span><span>{fmtMoney(o.profit||0)}</span>
              </div>
            </div>
          </div>

          {/* 區塊三：付款紀錄 */}
          <div style={{ padding:"0 14px 14px" }}>
            <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:10, letterSpacing:.5 }}>付款紀錄</div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {/* 訂金紀錄 */}
              {deposit > 0 && (
                <div style={{ padding:"10px 12px", background: o.deposit_paid?C.greenBg:C.amberBg, borderRadius:10, border:`1px solid ${o.deposit_paid?C.green:C.amber}30` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontSize:12, fontWeight:600, color:o.deposit_paid?C.green:C.amber }}>
                        {o.deposit_paid?"✓ 訂金已收":"○ 訂金待收"}
                      </div>
                      <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                        {o.payment_method==="transfer"?"匯款":o.payment_method==="cod"?"貨到付款":""}
                        {o.bank_code?` (${o.bank_code})`:""}
                        {o.payment_date?` · ${o.payment_date}`:""}
                      </div>
                    </div>
                    <div style={{ fontSize:15, fontWeight:700, color:o.deposit_paid?C.green:C.amber }}>{fmtMoney(deposit)}</div>
                  </div>
                  {!o.deposit_paid && (
                    <button onClick={async (e) => {
                      e.stopPropagation();
                      const beforePurchase = !o.status || ["pending_review", "cancelled"].includes(o.status);
                      const updateData = { deposit_paid: true };
                      if (beforePurchase) updateData.status = "pending";
                      const { error } = await supabase.from("orders").update(updateData).eq("id", o.id);
                      if (error) { if (toast) toast("更新失敗"); return; }
                      setData(d => ({ ...d, orders: d.orders.map(x => x.id === o.id ? { ...x, ...updateData } : x) }));
                      if (toast) toast(updateData.status === "pending" ? "✅ 已收訂金，訂單轉為「待採買」" : "✅ 已標記為訂金已收");
                    }}
                      style={{ marginTop:10, width:"100%", padding:"7px 12px", background:C.green, color:"#fff", border:"none", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer" }}>
                      ✓ 標記訂金已收
                    </button>
                  )}
                </div>
              )}
              {/* 尾款紀錄 */}
              {(shippingFee>0||deposit>0) && (
                <div style={{ padding:"10px 12px", background: o.final_paid?C.greenBg:C.blueBg, borderRadius:10, border:`1px solid ${o.final_paid?C.green:C.blue}30` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontSize:12, fontWeight:600, color:o.final_paid?C.green:C.blue }}>
                        {o.final_paid?"✓ 尾款已收":"○ 尾款待收"}
                      </div>
                      <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                        商品 {fmtMoney(total)} + 運費 {fmtMoney(shippingFee)} - 訂金 {fmtMoney(deposit)}
                      </div>
                    </div>
                    <div style={{ fontSize:15, fontWeight:700, color:o.final_paid?C.green:C.blue }}>{fmtMoney(finalPayment)}</div>
                  </div>
                </div>
              )}
              {/* 若無訂金/尾款，顯示一般收款狀態 */}
              {deposit===0 && shippingFee===0 && (
                <div style={{ padding:"10px 12px", background:o.paid?C.greenBg:C.amberBg, borderRadius:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontSize:12, fontWeight:600, color:o.paid?C.green:C.amber }}>{o.paid?"✓ 已收款":"○ 未收款"}</div>
                      <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                        {o.payment_method==="transfer"?"匯款":o.payment_method==="cod"?"貨到付款":""}
                        {o.bank_code?` (${o.bank_code})`:""}
                        {o.payment_date?` · ${o.payment_date}`:""}
                      </div>
                    </div>
                    <div style={{ fontSize:15, fontWeight:700, color:o.paid?C.green:C.amber }}>{fmtMoney(total)}</div>
                  </div>
                </div>
              )}
            </div>
            {/* 付款編輯 */}
            <div style={{ marginTop:10 }}>
              <PaymentFields order={o} setData={setData} toast={toast}/>
            </div>
          </div>

          {/* 操作列 */}
          <div style={{ padding:"10px 14px", borderTop:`1px solid ${C.borderLight}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:C.bgDeep }}>
            <div style={{ fontSize:12 }}>
              <span style={{ color:C.muted }}>成本 {fmtMoney(cost)}</span>
              <span style={{ margin:"0 6px", color:C.faint }}>·</span>
              <span style={{ color:C.green, fontWeight:700 }}>利潤 {fmtMoney(o.profit||0)}</span>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              {o.status==="arrived"&&(
                <button onClick={async()=>{
                  if(!window.confirm(`確定封存訂單 #${o.no}？`))return;
                  const now=new Date().toISOString();
                  const{error}=await supabase.from("orders").update({archived:true,archived_at:now}).eq("id",o.id);
                  if(!error){setData(d=>({...d,orders:d.orders.map(x=>x.id===o.id?{...x,archived:true,archived_at:now}:x)}));toast("已封存 📦");}
                }} style={{ background:"#eaede8",border:"none",color:"#3d4a3e",padding:"0 10px",height:30,borderRadius:8,fontSize:11,cursor:"pointer",fontWeight:600 }}>📦 封存</button>
              )}
              <button onClick={()=>del(o.id)} style={{ background:C.redBg,border:"none",color:C.red,width:30,height:30,borderRadius:8,fontSize:15,cursor:"pointer" }}>🗑</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddOrderModal({ data, setData, onClose, toast }) {
  // 從 members 撈客人清單，沒有則從訂單聚合
  const memberList = (data.members || []).map(m => ({
    id: m.line_user_id,
    name: m.line_name || m.community_name || "未知",
    communityName: m.community_name || "",
  }));
  // 補上訂單中有但 members 沒有的客人
  const orderCustomers = [];
  const seen = new Set(memberList.map(m => m.id));
  data.orders.forEach(o => {
    const key = o.customer_line_id || o.customerId;
    if (key && !seen.has(key)) {
      seen.add(key);
      orderCustomers.push({ id: key, name: o.customer_name || o.customerName || "未知", communityName: "" });
    }
  });
  const allCustomers = [...memberList, ...orderCustomers];

  const [customerId, setCustomerId] = useState(allCustomers[0]?.id || "");
  const [items, setItems] = useState([
    { id: secureUid(), name: "", cost: "", price: "", qty: "1", spec: "", variant: "" }
  ]);

  const updateItem = (id, key, val) => setItems(p => p.map(it => it.id === id ? { ...it, [key]: val } : it));
  const addItem = () => setItems(p => [...p, { id: secureUid(), name: "", cost: "", price: "", qty: "1", spec: "", variant: "" }]);
  const removeItem = id => setItems(p => p.filter(it => it.id !== id));

  const save = async () => {
    const c = allCustomers.find(x => x.id === customerId);
    if (!c) return alert("請選擇客人");
    const validItems = items.filter(it => it.name.trim());
    if (!validItems.length) return alert("請至少填寫一項商品名稱");

    const builtItems = validItems.map(it => {
      const priceNum = Math.max(0, Number(it.price) || 0);
      const costNum  = Math.max(0, Number(it.cost)  || 0);
      const qtyNum   = Math.max(1, Math.min(999, Number(it.qty) || 1));
      const fullName = [sanitize(it.name, 100), it.spec && sanitize(it.spec, 50), it.variant && sanitize(it.variant, 50)].filter(Boolean).join(" / ");
      return { name: fullName, cost: costNum, price: priceNum, qty: qtyNum, note: "" };
    });

    const total  = builtItems.reduce((s, it) => s + it.price * it.qty, 0);
    const profit = builtItems.reduce((s, it) => s + (it.price - it.cost) * it.qty, 0);
    const no = String(100000 + Math.floor(Math.random() * 900000));

    const orderData = {
      id: secureUid(), no,
      customer_line_id: c.id,
      customer_name: sanitize(c.name, 50),
      status: "pending",
      items: builtItems,
      total, profit,
      created_at: new Date().toISOString(),
    };

    try {
      const { data: saved, error } = await supabase.from("orders").insert([orderData]).select().single();
      if (error) throw error;
      setData(d => ({ ...d, orders: [saved, ...d.orders] }));
      logAction("手動新增訂單", `${c.name} · ${builtItems.length} 項`);
      toast("訂單已新增 ✨");
      onClose();
    } catch (e) {
      console.error(e);
      alert("新增失敗，請稍後再試");
    }
  };

  return (
    <Modal title="手動新增訂單" onClose={onClose} wide>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* 選擇客人 */}
        <div>
          <label style={{ fontSize: 12, color: C.muted, fontWeight: 600, display: "block", marginBottom: 6 }}>選擇客人 *</label>
          <select value={customerId} onChange={e => setCustomerId(e.target.value)}
            style={{ width: "100%", background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "9px 13px", color: C.text, fontSize: 14, cursor: "pointer" }}>
            {allCustomers.length === 0 && <option value="">尚無客人資料</option>}
            {allCustomers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}{c.communityName ? ` (${c.communityName})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* 品項清單 */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>商品品項</label>
            <button onClick={addItem} style={{ fontSize: 12, color: C.accent, background: C.accentBg, border: `1px solid ${C.accent}40`, borderRadius: 8, padding: "4px 12px", cursor: "pointer" }}>+ 新增品項</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {items.map((it, idx) => (
              <div key={it.id} style={{ background: C.bgDeep, borderRadius: 12, padding: "14px 14px 10px", border: `1px solid ${C.border}`, position: "relative" }}>
                {items.length > 1 && (
                  <button onClick={() => removeItem(it.id)}
                    style={{ position: "absolute", top: 10, right: 12, background: "none", border: "none", color: C.faint, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
                )}
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 10 }}>品項 {idx + 1}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Input label="商品名稱 *" value={it.name} onChange={v => updateItem(it.id, "name", v)} placeholder="資生堂防曬乳 SPF50" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <Input label="規格" value={it.spec} onChange={v => updateItem(it.id, "spec", v)} placeholder="50ml / 白色 / L號" />
                    <Input label="款式" value={it.variant} onChange={v => updateItem(it.id, "variant", v)} placeholder="草莓款 / 限定版" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    <Input label="售價 NT$ *" type="number" value={it.price} onChange={v => updateItem(it.id, "price", v)} placeholder="728" />
                    <Input label="成本 NT$" type="number" value={it.cost} onChange={v => updateItem(it.id, "cost", v)} placeholder="560" />
                    <Input label="數量" type="number" value={it.qty} onChange={v => updateItem(it.id, "qty", v)} placeholder="1" />
                  </div>
                  {it.price && it.cost && Number(it.price) > 0 && (
                    <div style={{ fontSize: 11, color: C.green }}>
                      利潤：NT$ {((Number(it.price) - Number(it.cost)) * Number(it.qty || 1)).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 合計 */}
        {items.some(it => it.price) && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: C.accentBg, borderRadius: 10, border: `1px solid ${C.accent}30` }}>
            <span style={{ fontSize: 13, color: C.muted }}>合計（{items.filter(it => it.name).length} 項）</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>
              NT$ {items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 1), 0).toLocaleString()}
            </span>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
          <Btn variant="ghost" onClick={onClose}>取消</Btn>
          <Btn onClick={save}>建立訂單</Btn>
        </div>
      </div>
    </Modal>
  );
}

function ReviewPage({ data, setData, toast }) {
  const pending = data.orders.filter(o => o.status === "pending_review");
  const approve = async id => {
    const o = data.orders.find(x => x.id === id);
    const { error } = await supabase.from("orders").update({ status: "pending" }).eq("id", id);
    if (error) { toast("更新失敗"); return; }
    setData(d => ({ ...d, orders: d.orders.map(o => o.id===id?{...o,status:"pending"}:o) }));
    logAction("審核通過", `訂單 #${o?.no} · ${o?.customer_name||o?.customerName}`);
    toast("已審核通過 ✅");
  };
  const reject = async id => {
    const o = data.orders.find(x => x.id === id);
    if (!window.confirm(`確定拒絕並刪除訂單 #${o?.no}？此操作無法復原。`)) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) { toast("刪除失敗"); return; }
    setData(d => ({ ...d, orders: d.orders.filter(o => o.id !== id) }));
    logAction("拒絕並刪除訂單", `訂單 #${o?.no} · ${o?.customerName}`);
    toast("已拒絕並刪除訂單");
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 16, color: C.accentDark }}>待審核 ({pending.length})</div>
      {!pending.length && <Card style={{ textAlign: "center", color: C.muted }}>✨ 沒有待審核訂單</Card>}
      {pending.map(o => (
        <Card key={o.id}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{o.customerName} · #{o.no}</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>{o.items.map(it=>`${it.name} ×${it.qty}`).join("・")}</div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn sm variant="success" onClick={() => approve(o.id)}>✅ 審核通過</Btn>
            <Btn sm variant="danger"  onClick={() => reject(o.id)}>❌ 拒絕</Btn>
          </div>
        </Card>
      ))}
    </div>
  );
}

function CatalogPage({ data, setData, toast }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  const toggle = async (id) => {
    const p = data.products.find(x => x.id === id);
    if (!p) return;
    const newStatus = p.status === "on" ? "off" : "on";
    const { error } = await supabase.from("products").update({ status: newStatus }).eq("id", id);
    if (error) { toast("更新失敗"); return; }
    setData(d => ({ ...d, products: d.products.map(x => x.id===id ? {...x, status:newStatus} : x) }));
    toast(newStatus === "on" ? "已上架" : "已下架");
  };

  const del = async (id) => {
    if (!window.confirm("確定刪除？")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast("刪除失敗"); return; }
    setData(d => ({ ...d, products: d.products.filter(p => p.id !== id) }));
    toast("已刪除");
  };

  const saveNew = async (prod) => {
    const { data: saved, error } = await supabase.from("products").insert([{ ...prod, created_at: new Date().toISOString() }]).select().single();
    if (error) { toast("新增失敗"); return; }
    setData(d => ({ ...d, products: [saved, ...d.products] }));
    toast("商品已新增");
    setShowAdd(false);
  };

  const saveEdit = async (prod) => {
    const { error } = await supabase.from("products").update(prod).eq("id", prod.id);
    if (error) { toast("儲存失敗"); return; }
    setData(d => ({ ...d, products: d.products.map(p => p.id===prod.id ? prod : p) }));
    toast("已儲存");
    setEditing(null);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
        <div style={{ fontWeight:700, fontSize:16, color:C.accentDark }}>賣場管理</div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 10px", background:C.accentBg, borderRadius:8, border:`1px solid ${C.border}` }}>
            <span style={{ fontSize:12, color:C.muted, fontWeight:600 }}>💱 匯率 ¥1 = NT$</span>
            <input type="number" step="0.001" value={data.rate || 0}
              onChange={e => {
                const r = Number(e.target.value) || 0;
                setData(d => ({ ...d, rate: r }));
                try { localStorage.setItem("exchange_rate_jpy", String(r)); } catch(err) {}
              }}
              style={{ width:70, background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, padding:"4px 8px", fontSize:13, color:C.text, fontWeight:600 }} />
          </div>
          <Btn sm onClick={() => setShowAdd(true)}>＋ 新增商品</Btn>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {data.products.map(p => (
          <div key={p.id} style={{ background:C.surface, border:`1.5px solid ${C.border}`, overflow:"hidden", boxShadow:C.shadow }}>
            <div style={{ background:C.bgDeep, padding:"16px 16px 12px", textAlign:"center", position:"relative", minHeight:90, display:"flex", alignItems:"center", justifyContent:"center" }}>
              {p.status==="on" && <span className="pill" style={{ position:"absolute", top:8, left:8, background:C.greenBg, color:C.green, fontSize:11 }}>販售中</span>}
              {p.status==="off"&& <span className="pill" style={{ position:"absolute", top:8, left:8, background:C.redBg,  color:C.red,   fontSize:11 }}>已下架</span>}
              {p.image && p.image.startsWith("data:") ? (
                <img src={p.image} alt={p.name} style={{ width:70, height:70, objectFit:"cover", borderRadius:10 }} />
              ) : (
                <div style={{ fontSize:32 }}>{p.image || "🛒"}</div>
              )}
            </div>
            <div style={{ padding:"10px 12px" }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:2 }}>{p.name}</div>
              <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>{p.category}</div>
              {/* Variants preview */}
              {p.variants && p.variants.length > 0 && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:8 }}>
                  {p.variants.map(v => (
                    <span key={v.id} style={{ fontSize:10, color:C.muted, border:`1px solid ${C.border}`, padding:"1px 7px", letterSpacing:.3 }}>{v.name}</span>
                  ))}
                </div>
              )}
              <div style={{ display:"flex", gap:6, marginTop:8 }}>
                <Btn sm variant="soft" onClick={() => setEditing(p)}>✏️ 編輯</Btn>
                <Btn sm variant="ghost" onClick={() => toggle(p.id)}>{p.status==="on"?"下架":"上架"}</Btn>
                <button onClick={() => del(p.id)} style={{ background:"none", border:"none", fontSize:15, cursor:"pointer", color:C.red }}>🗑</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAdd && <ProductModal onSave={saveNew} onClose={() => setShowAdd(false)} rate={data.rate} />}
      {editing && <ProductModal product={editing} onSave={saveEdit} onClose={() => setEditing(null)} rate={data.rate} />}
    </div>
  );
}

function ProductModal({ product, onSave, onClose, rate = 0 }) {
  const isEdit = !!product;
  const [name, setName]         = useState(product?.name || "");
  const [cat, setCat]           = useState(product?.category || "");
  const [productRate, setProductRate] = useState(product?.rate ? String(product.rate) : "");
  const [image, setImage]       = useState(product?.image || ""); // emoji or base64
  const [variants, setVariants] = useState(() => {
    const initRate = Number(product?.rate) || rate || 0;
    return (product?.variants || []).map(v => ({
      ...v,
      cost: v.cost != null ? v.cost : Math.round((Number(v.costJpy)||0) * initRate),
    }));
  });
  const [vName, setVName]       = useState("");
  const [vPrice, setVPrice]     = useState("");
  const [vCostJpy, setVCostJpy] = useState("");
  const [uploading, setUploading] = useState(false);

  // 有效匯率:商品自訂優先,否則用全域
  const effectiveRate = Number(productRate) || Number(rate) || 0;

  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("圖片不能超過 2MB"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage(ev.target.result); // base64 data URL
      setImgMode("file");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const addVariant = () => {
    const n = sanitize(vName, 50); if (!n) return;
    const jpy = Number(vCostJpy) || 0;
    const cost = Math.round(jpy * effectiveRate);
    setVariants(vs => [...vs, { id:secureUid(), name:n, price:Number(vPrice)||0, costJpy:jpy, cost }]);
    setVName(""); setVPrice(""); setVCostJpy("");
  };
  const removeVariant = id => setVariants(vs => vs.filter(v => v.id !== id));

  const save = () => {
    const cleanName = sanitize(name, 100);
    if (!cleanName) return alert("請填寫商品名稱");
    onSave({
      id: product?.id || secureUid(),
      name: cleanName,
      category: sanitize(cat, 50),
      price: 0,   // 已棄用,以 variants[].price 為主
      rate: Number(productRate) || 0,   // 0 = 用全域匯率
      image: image,
      status: product?.status || "on",
      variants,
    });
  };

  return (
    <Modal title={isEdit ? "編輯商品" : "新增賣場商品"} onClose={onClose} wide>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Input label="商品名稱 *" value={name} onChange={setName} placeholder="資生堂防曬乳" />
          <Input label="分類" value={cat} onChange={setCat} placeholder="藥妝" />
        </div>
        <div>
          <label style={{ fontSize: 12, color: C.muted, fontWeight: 700, letterSpacing: .5, textTransform: "uppercase", display:"block", marginBottom:5 }}>本商品匯率（留空＝用全域 {rate || "?"}）</label>
          <input type="number" step="0.001" value={productRate}
            onChange={e => {
              const newStr = e.target.value;
              setProductRate(newStr);
              const newRate = Number(newStr) || Number(rate) || 0;
              setVariants(vs => vs.map(v => ({
                ...v,
                cost: Math.round((Number(v.costJpy)||0) * newRate),
              })));
            }}
            placeholder={`預設 ${rate || "0"}`}
            style={{ width:"100%", maxWidth:340, background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "9px 13px", color: C.text, fontSize: 14, boxSizing:"border-box" }} />
          <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>目前 ¥1 = NT${effectiveRate || "?"}，影響本商品所有款式成本</div>
        </div>

        {/* Image upload section */}
        <div style={{ borderTop:`1.5px solid ${C.border}`, paddingTop:14 }}>
          <div style={{ fontWeight:700, fontSize:13, color:C.accentDark, marginBottom:10 }}>商品圖片</div>
          <div style={{ display:"flex", gap:8, marginBottom:12 }}>

          </div>

          {false ? (
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <Input label="Emoji 圖示" value={image} onChange={v => setImage(v.slice(0,4))} placeholder="💊 🎀 🛍" style={{ flex:1 }} />
              <div style={{ width:56, height:56, background:C.bgDeep, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, border:`1.5px solid ${C.border}`, flexShrink:0 }}>
                {image || "🛒"}
              </div>
            </div>
          ) : (
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ flex:1 }}>
                <label style={{ display:"block", cursor:"pointer" }}>
                  <div style={{ border:`2px dashed ${C.accent}`, borderRadius:12, padding:"16px 20px", textAlign:"center", background:C.accentBg, cursor:"pointer" }}>
                    {uploading ? (
                      <div style={{ color:C.muted, fontSize:13 }}>上傳中…</div>
                    ) : (
                      <>
                        <div style={{ fontSize:24, marginBottom:6 }}>📷</div>
                        <div style={{ fontSize:12, color:C.accentDark, fontWeight:600 }}>點擊選擇圖片</div>
                        <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>JPG / PNG，最大 2MB</div>
                      </>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageFile} style={{ display:"none" }} />
                </label>
              </div>
              {/* Preview */}
              <div style={{ width:80, height:80, background:C.bgDeep, borderRadius:12, overflow:"hidden", border:`1.5px solid ${C.border}`, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                {image && image.startsWith("data:") ? (
                  <img src={image} alt="preview" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                ) : (
                  <span style={{ fontSize:11, color:C.muted }}>預覽</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Variants */}
        <div style={{ borderTop:`1.5px solid ${C.border}`, paddingTop:14 }}>
          <div style={{ fontWeight:700, fontSize:13, color:C.accentDark, marginBottom:6 }}>款式設定</div>
          <div style={{ fontSize:12, color:C.muted, marginBottom:8, lineHeight:1.7 }}>
            例如：顏色（紅色、藍色）、尺寸（S / M / L）<br/>客人下單時可從中選擇
          </div>
          <div style={{ fontSize:11, color:C.muted, marginBottom:12, padding:"6px 10px", background:C.accentBg, borderRadius:6, border:`1px solid ${C.border}` }}>
            💱 成本預設＝日幣 × 匯率（目前 ¥1 = NT${effectiveRate || "?"}），也可直接修改下方成本欄位
          </div>
          {variants.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:12 }}>
              {variants.map(v => (
                <div key={v.id} style={{ display:"flex", alignItems:"flex-end", gap:8, padding:"10px 12px", background:C.bgDeep, borderRadius:8, border:`1px solid ${C.border}` }}>
                  <div style={{ flex:1.4, fontSize:13, fontWeight:600, paddingBottom:6 }}>{v.name}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:10, color:C.muted, marginBottom:2 }}>售價 NT$</div>
                    <input type="number" value={v.price||0}
                      onChange={e => setVariants(vs => vs.map(x => x.id===v.id ? {...x, price:Number(e.target.value)||0} : x))}
                      style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, padding:"4px 6px", fontSize:12 }}/>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:10, color:C.muted, marginBottom:2 }}>日幣價格 ¥</div>
                    <input type="number" value={v.costJpy||0}
                      onChange={e => {
                        const newJpy = Number(e.target.value) || 0;
                        setVariants(vs => vs.map(x => x.id===v.id
                          ? { ...x, costJpy: newJpy, cost: Math.round(newJpy * effectiveRate) }
                          : x));
                      }}
                      style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, padding:"4px 6px", fontSize:12 }}/>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:10, color:C.muted, marginBottom:2 }}>成本 NT$</div>
                    <input type="number" value={v.cost||0}
                      onChange={e => setVariants(vs => vs.map(x => x.id===v.id ? {...x, cost:Number(e.target.value)||0} : x))}
                      style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, padding:"4px 6px", fontSize:12, color:C.red, fontWeight:600 }}/>
                  </div>
                  <button onClick={() => removeVariant(v.id)} style={{ background:"none", border:"none", color:C.red, cursor:"pointer", fontSize:16, flexShrink:0, paddingBottom:6 }}>×</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
            <Input label="款式名稱" value={vName} onChange={setVName} placeholder="紅色 / M號 / 草莓" style={{ flex:2 }} />
            <Input label="售價 NT$" type="number" value={vPrice} onChange={setVPrice} placeholder="0" style={{ flex:1 }} />
            <Input label="日幣 ¥" type="number" value={vCostJpy} onChange={setVCostJpy} placeholder="0" style={{ flex:1 }} />
            <Btn sm variant="soft" onClick={addVariant} style={{ marginBottom:1 }}>+ 新增</Btn>
          </div>
        </div>

        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", paddingTop:8, borderTop:`1px solid ${C.border}` }}>
          <Btn variant="ghost" onClick={onClose}>取消</Btn>
          <Btn onClick={save}>{isEdit ? "儲存" : "新增商品"}</Btn>
        </div>
      </div>
    </Modal>
  );
}

function InStockPage({ data, setData, toast }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  const del = async (id) => {
    if (!window.confirm("確定刪除？")) return;
    const { error } = await supabase.from("in_stock").delete().eq("id", id);
    if (error) { toast("刪除失敗"); return; }
    setData(d => ({ ...d, inStock: d.inStock.filter(x => x.id !== id) }));
    toast("已刪除");
  };

  const saveNew = async (item) => {
    const { data: saved, error } = await supabase.from("in_stock").insert([{ ...item, created_at: new Date().toISOString() }]).select().single();
    if (error) { toast("新增失敗"); return; }
    setData(d => ({ ...d, inStock: [saved, ...d.inStock] }));
    toast("現貨已新增");
    setShowAdd(false);
  };

  const saveEdit = async (item) => {
    const { error } = await supabase.from("in_stock").update(item).eq("id", item.id);
    if (error) { toast("儲存失敗"); return; }
    setData(d => ({ ...d, inStock: d.inStock.map(x => x.id===item.id ? item : x) }));
    toast("已儲存");
    setEditing(null);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between" }}>
        <div style={{ fontWeight:700, fontSize:16, color:C.accentDark }}>🏪 現貨管理</div>
        <Btn sm onClick={() => setShowAdd(true)}>＋ 新增現貨</Btn>
      </div>

      {data.inStock.map(item => (
        <div key={item.id} style={{ background:C.surface, border:`1.5px solid ${C.border}`, boxShadow:C.shadow }}>
          <div style={{ padding:"13px 14px", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ fontSize:24 }}>{item.image||"🎁"}</div>
              <div>
                <div style={{ fontWeight:700 }}>{item.name}</div>
                <div style={{ fontSize:13, color:C.green, fontWeight:700 }}>{fmtMoney(item.price)}</div>
                {item.variants && item.variants.length > 0 && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:6 }}>
                    {item.variants.map(v => (
                      <span key={v.id} style={{ fontSize:10, color:C.muted, border:`1px solid ${C.border}`, padding:"1px 7px" }}>{v.name}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <Btn sm variant="soft" onClick={() => setEditing(item)}>✏️</Btn>
              <button onClick={() => del(item.id)} style={{ background:"none", border:"none", color:C.red, cursor:"pointer", fontSize:15 }}>🗑</button>
            </div>
          </div>
        </div>
      ))}

      {showAdd  && <StockModal onSave={saveNew}  onClose={() => setShowAdd(false)} />}
      {editing  && <StockModal product={editing} onSave={saveEdit} onClose={() => setEditing(null)} />}
    </div>
  );
}

function StockModal({ product, onSave, onClose }) {
  const isEdit = !!product;
  const [name, setName]     = useState(product?.name || "");
  const [price, setPrice]   = useState(String(product?.price || ""));
  const [image, setImage]   = useState(product?.image || "");
  const [variants, setVariants] = useState(product?.variants || []);
  const [vName, setVName]   = useState("");
  const [vPrice, setVPrice] = useState("");

  const addVariant = () => {
    const n = sanitize(vName, 50); if (!n) return;
    setVariants(vs => [...vs, { id:secureUid(), name:n, price:Number(vPrice)||0 }]);
    setVName(""); setVPrice("");
  };
  const removeVariant = id => setVariants(vs => vs.filter(v => v.id !== id));

  const save = () => {
    const cleanName = sanitize(name, 100);
    if (!cleanName || !price) return alert("請填寫名稱與價格");
    onSave({ id:product?.id||secureUid(), name:cleanName, price:Math.max(0,Number(price)||0), image:sanitize(image,10)||"🎁", status:"on", variants });
  };

  return (
    <Modal title={isEdit ? "編輯現貨" : "新增現貨"} onClose={onClose} wide>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:10 }}>
          <Input label="商品名稱 *" value={name}  onChange={setName}  placeholder="Hello Kitty 鑰匙圈" />
          <Input label="價格 NT$ *" type="number" value={price} onChange={setPrice} placeholder="350" />
          <Input label="圖示 Emoji" value={image} onChange={setImage} placeholder="🎀" />
        </div>

        {/* Variants */}
        <div style={{ borderTop:`1.5px solid ${C.border}`, paddingTop:14 }}>
          <div style={{ fontWeight:700, fontSize:13, color:C.accentDark, marginBottom:10 }}>款式設定</div>
          <div style={{ fontSize:12, color:C.muted, marginBottom:12 }}>例如：草莓款、藍色、M號… 客人下單時可選擇</div>

          {variants.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:12 }}>
              {variants.map(v => (
                <div key={v.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:C.bgDeep, border:`1px solid ${C.border}` }}>
                  <div style={{ flex:1 }}>
                    <span style={{ fontSize:13, fontWeight:600 }}>{v.name}</span>
                    {v.price > 0 && <span style={{ fontSize:11, color:C.muted, marginLeft:8 }}>+NT${v.price}</span>}
                    {v.cost > 0 && <span style={{ fontSize:11, color:C.red, marginLeft:8 }}>成本 NT${v.cost}</span>}
                  </div>
                  <button onClick={() => removeVariant(v.id)} style={{ background:"none", border:"none", color:C.red, cursor:"pointer", fontSize:16 }}>×</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
            <Input label="款式名稱" value={vName} onChange={setVName} placeholder="草莓款 / 紅色" style={{ flex:2 }} />
            <Input label="加價 NT$" type="number" value={vPrice} onChange={setVPrice} placeholder="0" style={{ flex:1 }} />
            <Btn sm variant="soft" onClick={addVariant} style={{ marginBottom:1 }}>+ 新增</Btn>
          </div>
        </div>

        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", paddingTop:8, borderTop:`1px solid ${C.border}` }}>
          <Btn variant="ghost" onClick={onClose}>取消</Btn>
          <Btn onClick={save}>{isEdit ? "儲存" : "新增現貨"}</Btn>
        </div>
      </div>
    </Modal>
  );
}

function WishlistPage({ data, setData, toast }) {
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState("");
  const [editNote, setEditNote] = useState("");

  const updateStatus = async (id, status) => {
    const { error } = await supabase.from("wishlist").update({ status }).eq("id", id);
    if (error) { toast("更新失敗"); return; }
    setData(d => ({ ...d, wishlist: d.wishlist.map(w => w.id===id ? {...w,status} : w) }));
    if (status === "found") {
      setEditingId(id);
      const w = data.wishlist.find(x => x.id === id);
      setEditPrice(w?.price ? String(w.price) : "");
      setEditNote(w?.found_note || "");
    }
    toast("已更新");
  };

  const saveQuote = async (id) => {
    const price = Math.max(0, Number(editPrice) || 0);
    const found_note = editNote.trim().slice(0, 200);
    const { error } = await supabase.from("wishlist").update({ price, found_note }).eq("id", id);
    if (error) { toast("儲存失敗"); return; }
    setData(d => ({ ...d, wishlist: d.wishlist.map(w => w.id===id ? {...w, price, found_note} : w) }));
    setEditingId(null); setEditPrice(""); setEditNote("");
    toast("報價已通知客人 ✅");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 16, color: C.accentDark }}>許願清單 ({data.wishlist.length})</div>
      {!data.wishlist.length && <Card style={{ textAlign:"center" }}><div style={{ fontSize:40 }}>⭐</div><div style={{ color:C.muted, marginTop:8 }}>還沒有客人許願</div></Card>}
      {data.wishlist.map(w => {
        const isFound = w.status === "found";
        const isEditing = editingId === w.id;
        return (
          <Card key={w.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: isFound ? 12 : 0 }}>
              <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                <div style={{ fontWeight: 700 }}>{w.name}</div>
                <div style={{ fontSize: 13, color: C.muted }}>客人：{w.customer_name || w.customerName}</div>
                {w.note && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>✏️ {w.note}</div>}
                {w.link && <a href={w.link} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: C.accent, display:"block", marginTop:4, wordBreak:"break-all" }}>🔗 {w.link}</a>}
                {w.img_url && <img src={w.img_url} alt="參考圖" onError={e=>e.target.style.display="none"} style={{ width:"100%", maxHeight:140, objectFit:"cover", borderRadius:8, marginTop:8, border:`1px solid ${C.border}` }}/>}
              </div>
              <select value={w.status} onChange={e => updateStatus(w.id, e.target.value)}
                style={{ background: C.bgDeep, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "4px 8px", fontSize: 12, cursor: "pointer", flexShrink: 0 }}>
                <option value="searching">⭐ 許願中</option>
                <option value="found">✅ 找到了</option>
              </select>
            </div>

            {/* 已找到：顯示報價區 */}
            {isFound && (
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                {isEditing ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>回填報價給客人</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>報價 NT$</div>
                        <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)}
                          placeholder="0"
                          style={{ width: "100%", background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 14, color: C.text, outline: "none" }}
                          onFocus={e => e.target.style.borderColor = C.accent}
                          onBlur={e => e.target.style.borderColor = C.border}
                        />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>備註（可選）</div>
                      <input value={editNote} onChange={e => setEditNote(e.target.value)}
                        placeholder="例：京都限定款，數量有限"
                        style={{ width: "100%", background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: C.text, outline: "none" }}
                        onFocus={e => e.target.style.borderColor = C.accent}
                        onBlur={e => e.target.style.borderColor = C.border}
                      />
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => saveQuote(w.id)}
                        style={{ flex: 1, background: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "9px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        儲存並通知客人
                      </button>
                      <button onClick={() => setEditingId(null)}
                        style={{ background: C.bgDeep, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer" }}>
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      {w.price > 0
                        ? <><div style={{ fontSize: 13, color: C.muted }}>已回填報價</div><div style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>NT$ {Number(w.price).toLocaleString()}</div></>
                        : <div style={{ fontSize: 13, color: C.muted }}>尚未回填報價</div>
                      }
                      {w.found_note && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{w.found_note}</div>}
                    </div>
                    <button onClick={() => { setEditingId(w.id); setEditPrice(w.price ? String(w.price) : ""); setEditNote(w.found_note || ""); }}
                      style={{ background: C.bgDeep, color: C.textMid, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 14px", fontSize: 12, cursor: "pointer" }}>
                      {w.price > 0 ? "修改報價" : "填入報價"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function AnnouncementsPage({ data, setData, toast }) {
  const [editing, setEditing] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const startEdit = (ann) => { setEditing(ann.id); setTitle(ann.title); setContent(ann.content); };
  const startNew  = () => { setEditing("new"); setTitle(""); setContent(""); };
  const cancel    = () => { setEditing(null); setTitle(""); setContent(""); };

  const save = async () => {
    if (!title.trim() || !content.trim()) return alert("請填寫標題和內容");
    if (editing === "new") {
      const newAnn = { id: secureUid(), title: title.trim(), content: content.trim(), created_at: new Date().toISOString() };
      const { data: saved, error } = await supabase.from("announcements").insert([newAnn]).select().single();
      if (error) { toast("新增失敗"); return; }
      setData(d => ({ ...d, announcements: [saved, ...d.announcements] }));
      toast("公告已新增 📢");
    } else {
      const { error } = await supabase.from("announcements").update({ title: title.trim(), content: content.trim() }).eq("id", editing);
      if (error) { toast("更新失敗"); return; }
      setData(d => ({ ...d, announcements: d.announcements.map(a => a.id === editing ? { ...a, title: title.trim(), content: content.trim() } : a) }));
      toast("公告已更新 ✅");
    }
    cancel();
  };

  const del = async (id) => {
    if (!window.confirm("確定刪除此公告？")) return;
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) { toast("刪除失敗"); return; }
    setData(d => ({ ...d, announcements: d.announcements.filter(a => a.id !== id) }));
    toast("公告已刪除");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: C.accentDark }}>📢 公告管理</div>
        {editing === null && <Btn sm onClick={startNew}>＋ 新增公告</Btn>}
      </div>

      {/* Editor */}
      {editing !== null && (
        <div className="fade" style={{ background: C.surface, border: `2px solid ${C.accent}`, borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.accentDark }}>
            {editing === "new" ? "✏️ 新增公告" : "✏️ 編輯公告"}
          </div>
          <Input label="標題 *" value={title} onChange={setTitle} placeholder="例：第一天（4/21）行程公告" />
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 12, color: C.muted, fontWeight: 700, letterSpacing: .5, textTransform: "uppercase" }}>內容 *</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={"✨ 08:00 SUGI藥妝\n── 停留1小時 ──\n✨ 09:10 7-11"}
              rows={10}
              style={{
                background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10,
                padding: "10px 13px", color: C.text, fontSize: 13,
                lineHeight: 1.8, resize: "vertical", fontFamily: "'Noto Sans TC', sans-serif",
                transition: "border .15s",
              }}
              onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 3px ${C.accent}15`; }}
              onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
            />
            <div style={{ fontSize: 11, color: C.muted }}>可用換行和 emoji，客人端會原樣顯示</div>
          </div>

          {/* Preview */}
          {(title || content) && (
            <div style={{ background: C.yellowBg, borderLeft: `4px solid ${C.yellow}`, borderRadius: "0 10px 10px 0", padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: C.yellow, fontWeight: 700, marginBottom: 6 }}>預覽（客人端顯示效果）</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{title || "（標題）"}</div>
              <pre style={{ fontSize: 12, color: C.textMid, lineHeight: 1.8, whiteSpace: "pre-wrap", fontFamily: "'Noto Sans TC', sans-serif" }}>{content || "（內容）"}</pre>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="ghost" onClick={cancel}>取消</Btn>
            <Btn onClick={save}>{editing === "new" ? "發布公告" : "儲存修改"}</Btn>
          </div>
        </div>
      )}

      {/* List */}
      {data.announcements.length === 0 && editing === null && (
        <Card style={{ textAlign: "center", color: C.muted, padding: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📢</div>
          <div>還沒有公告，點上方按鈕新增</div>
        </Card>
      )}

      {data.announcements.map(ann => (
        <div key={ann.id} style={{
          background: C.surface, border: `1.5px solid ${editing === ann.id ? C.accent : C.border}`,
          borderRadius: 16, overflow: "hidden", boxShadow: C.shadow,
          opacity: editing !== null && editing !== ann.id ? 0.5 : 1,
          transition: "opacity .2s",
        }}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: C.accentDark, marginBottom: 4 }}>📢 {ann.title}</div>
                <div style={{ fontSize: 11, color: C.muted }}>發布：{ann.createdAt}</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <Btn sm variant="soft" onClick={() => startEdit(ann)} disabled={editing !== null}>✏️ 編輯</Btn>
                <Btn sm variant="danger" onClick={() => del(ann.id)} disabled={editing !== null}>刪除</Btn>
              </div>
            </div>
          </div>
          <div style={{ padding: "12px 16px", background: C.bgDeep }}>
            <pre style={{ fontSize: 12, color: C.textMid, lineHeight: 1.8, whiteSpace: "pre-wrap", fontFamily: "'Noto Sans TC', sans-serif", maxHeight: 120, overflow: "hidden" }}>
              {ann.content.length > 200 ? ann.content.slice(0, 200) + "…" : ann.content}
            </pre>
          </div>
        </div>
      ))}
    </div>
  );
}

function CustomersPage({ data, setData, toast, sendLineNotify }) {
  const [expandedId, setExpandedId]   = useState(null);
  const [detailFilter, setDetailFilter] = useState("all");
  const [search, setSearch]           = useState("");
  const [editingId, setEditingId]     = useState(null);
  const [noteInput, setNoteInput]     = useState("");
  const [notifyTargets, setNotifyTargets] = useState(null);

  // ── 從訂單動態彙整客人清單 ──────────────────────────────────
  // 不依賴 data.customers，直接從 data.orders 聚合
  // key = customer_line_id（Supabase）或 customerId（本機）
  const uniqueCustomerOrders = Array.from(new Map(data.orders.map(o => [o.id, o])).values());
  const customerMap = {};
  uniqueCustomerOrders.forEach(o => {
    const key   = o.customer_line_id || o.customerId || o.customerName;
    const name  = o.customer_name    || o.customerName || "未知";
    if (!customerMap[key]) {
      const memberInfo = (data.members || []).find(m => m.line_user_id === key);
      customerMap[key] = {
        id:            key,
        name,
        lineId:        o.customer_line_id || o.customerId || "",
        communityName: memberInfo?.community_name || "",
        phone:         memberInfo?.phone || "",
        recipientName: memberInfo?.recipient_name || "",
        igLink:        memberInfo?.ig_threads || "",
        sevenStore:    memberInfo?.seven_store || "",
        lineId2:       memberInfo?.line_id || "",
        note:          data.customerNotes?.[key] || "",
        orders:        [],
      };
    }
    customerMap[key].orders.push(o);
  });
  const allCustomers = Object.values(customerMap).sort((a, b) => {
    // 最近有訂單的排前面
    const aLast = Math.max(...a.orders.map(o => new Date(o.created_at || o.createdAt || 0).getTime()));
    const bLast = Math.max(...b.orders.map(o => new Date(o.created_at || o.createdAt || 0).getTime()));
    return bLast - aLast;
  });

  // 搜尋
  const filtered = allCustomers.filter(c =>
    !search.trim() ||
    c.name.includes(search.trim()) ||
    c.lineId.includes(search.trim()) ||
    c.note.includes(search.trim())
  );

  // 儲存備註
  const saveNote = (customerId) => {
    setData(d => ({
      ...d,
      customerNotes: { ...(d.customerNotes || {}), [customerId]: sanitize(noteInput, 200) }
    }));
    setEditingId(null);
    toast("備註已儲存");
  };

  // 狀態更新（直接在這頁也能改）
  const updateStatus = async (orderId, status) => {
    const safe = ["pending_review","pending","bought","shipped","arrived","cancelled"].includes(status) ? status : "pending_review";
    const { error } = await supabase.from("orders").update({ status: safe, updated_at: new Date().toISOString() }).eq("id", orderId);
    if (error) { toast("更新失敗"); return; }
    setData(d => ({ ...d, orders: d.orders.map(o => o.id === orderId ? { ...o, status: safe } : o) }));
    toast("狀態已更新");
  };

  if (data.orders.length === 0) {
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ fontWeight:700, fontSize:16, color:C.accentDark }}>客人管理</div>
        <Card style={{ textAlign:"center", padding:40, color:C.muted }}>
          <div style={{ fontSize:36, marginBottom:12 }}>📋</div>
          <div style={{ fontWeight:600, marginBottom:6 }}>還沒有任何訂單</div>
          <div style={{ fontSize:13 }}>客人透過下單系統送出訂單後，<br/>會自動在這裡出現</div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {notifyTargets && (
        <LineNotifyModal
          targets={notifyTargets}
          onSend={sendLineNotify}
          onClose={() => setNotifyTargets(null)}
        />
      )}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontWeight:700, fontSize:16, color:C.accentDark }}>
          客人管理（{allCustomers.length} 位）
        </div>
        <button onClick={() => setNotifyTargets(allCustomers.map(c => ({ name: c.name, lineUserId: c.lineId })))}
          style={{ fontSize:12, background:"#3d4a3e", color:"#fff", border:"none", borderRadius:99, padding:"7px 16px", cursor:"pointer", fontWeight:600 }}>
          📨 全體通知
        </button>
      </div>

      {/* 搜尋 */}
      <div style={{ position:"relative" }}>
        <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:15, color:C.muted, pointerEvents:"none" }}>🔍</span>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setExpandedId(null); }}
          placeholder="搜尋客人名稱、LINE ID、備註…"
          style={{ width:"100%", background:C.bg, border:`1.5px solid ${C.border}`, borderRadius:10, padding:"9px 14px 9px 36px", color:C.text, fontSize:14 }}
          onFocus={e => { e.target.style.borderColor=C.accent; e.target.style.boxShadow=`0 0 0 3px ${C.accent}15`; }}
          onBlur={e => { e.target.style.borderColor=C.border; e.target.style.boxShadow="none"; }}
        />
        {search && (
          <button onClick={() => { setSearch(""); setExpandedId(null); }} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:C.faint, border:"none", color:C.muted, width:20, height:20, borderRadius:"50%", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
        )}
      </div>

      {search && <div style={{ fontSize:13, color:C.muted }}>找到 {filtered.length} 位客人</div>}
      {search && filtered.length === 0 && (
        <div style={{ textAlign:"center", padding:"32px 0", color:C.muted, fontSize:14 }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🔍</div>找不到「{search}」
        </div>
      )}

      {/* 客人卡片清單 */}
      {filtered.map(c => {
        const orders     = c.orders;
        const total      = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + (o.total || 0), 0);
        const isOpen     = expandedId === c.id;
        const isEditing  = editingId === c.id;
        const statusCounts = Object.keys(ORDER_STATUS).reduce((acc, s) => {
          acc[s] = orders.filter(o => o.status === s).length;
          return acc;
        }, {});
        const filteredOrders = detailFilter === "all" ? orders : orders.filter(o => o.status === detailFilter);

        return (
          <div key={c.id} style={{ background:C.surface, border:`1.5px solid ${isOpen ? C.accent : C.border}`, borderRadius:18, overflow:"hidden", boxShadow:isOpen ? C.shadowMd : C.shadow, transition:"all .2s" }}>

            {/* 客人行 — 點擊展開 */}
            <div
              onClick={() => { setExpandedId(isOpen ? null : c.id); setDetailFilter("all"); setEditingId(null); }}
              style={{ padding:"16px 18px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer", background:isOpen ? C.accentBg : "transparent", transition:"background .15s" }}
            >
              <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                {/* 頭像 */}
                <div style={{ width:46, height:46, borderRadius:"50%", background:C.accentBg, border:`2px solid ${C.accentLight}40`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:C.accent, fontSize:19, flexShrink:0 }}>
                  {c.name?.[0] || "?"}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:15 }}>{c.name}</div>
                  {c.note
                    ? <div style={{ fontSize:11, color:C.accent, marginTop:2 }}>📝 {c.note}</div>
                    : <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>LINE：{c.lineId ? c.lineId.slice(0,12)+"…" : "—"}</div>
                  }
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:11, color:C.muted }}>訂單 / 消費</div>
                  <div style={{ fontWeight:700, color:C.accentDark }}>{orders.length} 筆 / {fmtMoney(total)}</div>
                </div>
                <div style={{ fontSize:20, color:C.muted, transform:isOpen?"rotate(90deg)":"none", transition:"transform .2s" }}>›</div>
              </div>
            </div>

            {/* 展開內容 */}
            {isOpen && (
              <div className="fade" style={{ borderTop:`1.5px solid ${C.border}` }}>

                {/* 備註列 */}
                <div style={{ padding:"12px 18px", background:C.bgDeep, display:"flex", alignItems:"center", gap:10 }}>
                  {isEditing ? (
                    <>
                      <input
                        value={noteInput}
                        onChange={e => setNoteInput(e.target.value)}
                        placeholder="輸入備註（電話、地址、VIP 等）"
                        maxLength={200}
                        style={{ flex:1, background:C.bg, border:`1.5px solid ${C.accent}`, borderRadius:8, padding:"7px 12px", fontSize:13, color:C.text }}
                        autoFocus
                        onKeyDown={e => { if (e.key==="Enter") saveNote(c.id); if (e.key==="Escape") setEditingId(null); }}
                      />
                      <Btn sm onClick={() => saveNote(c.id)}>儲存</Btn>
                      <Btn sm variant="ghost" onClick={() => setEditingId(null)}>取消</Btn>
                    </>
                  ) : (
                    <>
                      <div style={{ flex:1, fontSize:13, color:c.note ? C.text : C.muted }}>
                        📝 {c.note || "尚無備註（可記電話、地址、VIP 備注）"}
                      </div>
                      <button onClick={e => { e.stopPropagation(); setNotifyTargets([{ name: c.name, lineUserId: c.lineId }]); }}
                        style={{ fontSize:11, background:"#3d4a3e", color:"#fff", border:"none", borderRadius:99, padding:"5px 12px", cursor:"pointer", whiteSpace:"nowrap", fontWeight:600 }}>
                        📨 通知
                      </button>
                      <Btn sm variant="ghost" onClick={e => { e.stopPropagation(); setNoteInput(c.note||""); setEditingId(c.id); }}>✏️ 編輯</Btn>
                    </>
                  )}
                </div>

                {/* 客人個資 */}
                <div style={{ margin:"0 18px 12px", padding:"12px 14px", background:C.bgDeep, borderRadius:10, fontSize:12, color:C.textMid }}>
                  <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:8, letterSpacing:.5 }}>客人資料</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 16px" }}>
                    <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
                      <span style={{ fontSize:10, color:C.faint }}>社群名稱</span>
                      <span style={{ fontWeight:500, color:c.communityName?C.text:C.faint }}>{c.communityName||"未填寫"}</span>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
                      <span style={{ fontSize:10, color:C.faint }}>收件人</span>
                      <span style={{ fontWeight:500, color:c.recipientName?C.text:C.faint }}>{c.recipientName||"未填寫"}</span>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
                      <span style={{ fontSize:10, color:C.faint }}>電話</span>
                      <span style={{ fontWeight:500, color:c.phone?C.text:C.faint }}>{c.phone||"未填寫"}</span>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
                      <span style={{ fontSize:10, color:C.faint }}>7-11 門市</span>
                      <span style={{ color:c.sevenStore?C.text:C.faint }}>{c.sevenStore||"未填寫"}</span>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
                      <span style={{ fontSize:10, color:C.faint }}>LINE ID</span>
                      <span style={{ color:c.lineId2?C.text:C.faint }}>{c.lineId2||"未填寫"}</span>
                    </div>
                    {c.igLink && (
                      <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
                        <span style={{ fontSize:10, color:C.faint }}>IG / FB</span>
                        <a href={c.igLink} target="_blank" rel="noreferrer" style={{ color:C.accent, wordBreak:"break-all", fontSize:11 }}>{c.igLink}</a>
                      </div>
                    )}
                  </div>
                </div>

                {/* 狀態篩選列 */}
                <div style={{ padding:"12px 18px 8px", background:C.bgDeep, display:"flex", gap:8, overflowX:"auto" }}>
                  {[
                    { label:"全部", value:orders.length, key:"all", color:C.text },
                    ...Object.entries(ORDER_STATUS).map(([k,v]) => ({ label:v.label, value:statusCounts[k], key:k, color:v.color, icon:v.icon }))
                  ].filter(s => s.value > 0 || s.key === "all").map(s => (
                    <button key={s.key} onClick={() => setDetailFilter(s.key)} style={{
                      flexShrink:0, background:detailFilter===s.key ? C.surface : "transparent",
                      border:`1.5px solid ${detailFilter===s.key ? C.accent : C.border}`,
                      borderRadius:10, padding:"6px 12px", cursor:"pointer", textAlign:"center", transition:"all .15s",
                    }}>
                      <div style={{ fontSize:16, fontWeight:700, color:s.color }}>{s.value}</div>
                      <div style={{ fontSize:10, color:C.muted, marginTop:1 }}>{s.icon||""} {s.label}</div>
                    </button>
                  ))}
                </div>

                {/* 訂單明細 */}
                <div style={{ padding:"10px 18px 16px", display:"flex", flexDirection:"column", gap:10 }}>
                  {filteredOrders.length === 0 && (
                    <div style={{ textAlign:"center", padding:24, color:C.muted, fontSize:14 }}>此狀態沒有訂單</div>
                  )}
                  {filteredOrders.map(o => {
                    const createdDate = o.created_at
                      ? new Date(o.created_at).toLocaleDateString("zh-TW")
                      : (o.createdAt || "—");
                    return (
                      <div key={o.id} style={{ background:C.bg, borderRadius:14, border:`1.5px solid ${C.border}`, overflow:"hidden" }}>
                        {/* 訂單 header */}
                        <div style={{ padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                          <div>
                            <div style={{ fontSize:11, color:C.muted, marginBottom:3 }}>#{o.no} · {createdDate}</div>
                            <div style={{ fontWeight:700, fontSize:14 }}>
                              {o.items?.[0]?.name}{(o.items?.length||0) > 1 ? ` 等 ${o.items.length} 件` : ""}
                            </div>
                          </div>
                          {/* 可直接改狀態 */}
                          <select
                            value={o.status}
                            onChange={e => updateStatus(o.id, e.target.value)}
                            onClick={e => e.stopPropagation()}
                            style={{ background:C.bg, border:`1.5px solid ${C.border}`, borderRadius:8, padding:"4px 8px", fontSize:12, cursor:"pointer", color:C.text }}
                          >
                            {Object.entries(ORDER_STATUS).map(([k,v]) => (
                              <option key={k} value={k}>{v.icon} {v.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* 商品明細 */}
                        <div style={{ margin:"0 14px", background:C.surface, borderRadius:10, overflow:"hidden", border:`1px solid ${C.border}` }}>
                          {(o.items||[]).map((it, i) => {
                            return (
                            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 13px", borderBottom: i < (o.items.length-1) ? `1px solid ${C.borderSoft}` : "none", gap:10 }}>
                              <div style={{ display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0 }}>
                                <div style={{ width:40, height:40, borderRadius:8, background:C.bgDeep, flexShrink:0, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>
                                  {it.image?.startsWith("data:")||it.image?.startsWith("http")
                                    ? <img src={it.image} alt={it.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>e.target.style.display="none"}/>
                                    : it.image
                                      ? <span>{it.image}</span>
                                      : <span style={{ fontSize:16, color:C.faint }}>🛒</span>
                                  }
                                </div>
                                <div style={{ minWidth:0 }}>
                                  <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{it.name}</div>
                                  {it.note && <div style={{ fontSize:11, color:C.muted }}>備註：{it.note}</div>}
                                </div>
                              </div>
                              <div style={{ textAlign:"right", fontSize:13, flexShrink:0 }}>
                                <div style={{ color:C.muted }}>×{it.qty}</div>
                                <div style={{ fontWeight:700 }}>{fmtMoney((it.price||0) * (it.qty||1))}</div>
                              </div>
                            </div>
                            );
                          })}
                        </div>

                        {/* 訂單 footer */}
                        <div style={{ padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <div style={{ fontSize:12, color:C.muted }}>
                            {o.profit > 0 && <span style={{ color:C.green, fontWeight:600 }}>利潤 {fmtMoney(o.profit)}</span>}
                          </div>
                          <div style={{ fontWeight:700, color:C.accentDark }}>{fmtMoney(o.total)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 小計 */}
                <div style={{ margin:"0 18px 12px", background:C.accentBg, borderRadius:12, padding:"12px 16px", display:"flex", justifyContent:"space-between", border:`1.5px solid ${C.accentLight}40` }}>
                  <div style={{ fontSize:13, color:C.accentDark, fontWeight:600 }}>💰 消費總計（不含取消）</div>
                  <div style={{ fontWeight:700, fontSize:16, color:C.accentDark }}>{fmtMoney(total)}</div>
                </div>

                {/* 合併訂單按鈕 */}
                {orders.filter(o => o.status !== "cancelled").length > 1 && (
                  <div style={{ margin:"0 18px 16px" }}>
                    <MergeOrdersButton
                      orders={orders.filter(o => o.status !== "cancelled")}
                      customer={c}
                      setData={setData}
                      toast={toast}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MergeOrdersButton({ orders, customer, setData, toast }) {
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState([]);
  const [merging, setMerging] = useState(false);

  const toggle = id => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const merge = async () => {
    if (selected.length < 2) { toast("請至少選擇 2 筆訂單合併"); return; }
    setMerging(true);
    const toMerge = orders.filter(o => selected.includes(o.id));
    const allItems = toMerge.flatMap(o => o.items || []);
    const total = allItems.reduce((s, it) => s + (it.price||0) * (it.qty||1), 0);
    const profit = toMerge.reduce((s, o) => s + (o.profit||0), 0);
    const no = String(100000 + Math.floor(Math.random() * 900000));
    const mergedOrder = {
      id: crypto.randomUUID().replace(/-/g,"").slice(0,12),
      no,
      customer_line_id: customer.lineId,
      customer_name: customer.name,
      status: toMerge[0].status,
      items: allItems,
      total, profit,
      created_at: new Date().toISOString(),
    };
    try {
      // 建立合併後訂單
      const { data: saved, error } = await supabase.from("orders").insert([mergedOrder]).select().single();
      if (error) throw error;
      // 刪除原訂單
      await supabase.from("orders").delete().in("id", selected);
      setData(d => ({
        ...d,
        orders: [saved, ...d.orders.filter(o => !selected.includes(o.id))]
      }));
      toast(`✅ 已合併 ${selected.length} 筆訂單`);
      setSelecting(false);
      setSelected([]);
    } catch(e) {
      console.error(e);
      toast("合併失敗，請稍後再試");
    }
    setMerging(false);
  };

  if (!selecting) return (
    <button onClick={() => { setSelecting(true); setSelected([]); }}
      style={{ width:"100%", background:C.bgDeep, border:`1.5px solid ${C.border}`, borderRadius:10, padding:"9px", fontSize:12, color:C.textMid, cursor:"pointer", fontWeight:500 }}>
      🔗 合併訂單
    </button>
  );

  return (
    <div style={{ background:C.bgDeep, borderRadius:12, padding:"14px", border:`1.5px solid ${C.accent}40` }}>
      <div style={{ fontSize:12, color:C.accent, fontWeight:600, marginBottom:10 }}>選擇要合併的訂單（至少 2 筆）</div>
      <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:12 }}>
        {orders.map(o => (
          <label key={o.id} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", padding:"6px 8px", borderRadius:8, background: selected.includes(o.id) ? C.accentBg : "transparent", border: `1px solid ${selected.includes(o.id) ? C.accent : C.border}` }}>
            <input type="checkbox" checked={selected.includes(o.id)} onChange={() => toggle(o.id)} style={{ accentColor: C.accent }} />
            <span style={{ fontSize:12, flex:1 }}>#{o.no} · {o.items?.[0]?.name}{(o.items?.length||0)>1?` 等${o.items.length}件`:""}</span>
            <span style={{ fontSize:12, fontWeight:600, color:C.accent }}>{fmtMoney(o.total)}</span>
          </label>
        ))}
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={merge} disabled={merging || selected.length < 2}
          style={{ flex:1, background: selected.length < 2 ? C.faint : C.accent, color:"#fff", border:"none", borderRadius:8, padding:"9px", fontSize:12, cursor: selected.length < 2 ? "not-allowed" : "pointer", fontWeight:600 }}>
          {merging ? "合併中..." : `合併 ${selected.length} 筆`}
        </button>
        <button onClick={() => { setSelecting(false); setSelected([]); }}
          style={{ background:C.bgDeep, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 16px", fontSize:12, cursor:"pointer", color:C.muted }}>
          取消
        </button>
      </div>
    </div>
  );
}

const DEFAULT_TEMPLATES = [
  "您好！您的訂單已採購完成，請留意後續寄送通知 📦",
  "您好！您的商品已從日本寄出，請稍候等待到台通知 ✈️",
  "您好！您的商品已到台灣，我們會盡快安排出貨，請確認收件資訊 🎁",
  "您好！您有一筆訂單待付款，請盡快完成付款，謝謝 💳",
];

function LineNotifyModal({ targets, onSend, onClose }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState(() => {
    try { return JSON.parse(localStorage.getItem("line_templates") || "null") || DEFAULT_TEMPLATES; }
    catch { return DEFAULT_TEMPLATES; }
  });
  const [editingTpl, setEditingTpl] = useState(null);
  const [tplInput, setTplInput] = useState("");

  const saveTemplates = (t) => {
    setTemplates(t);
    try { localStorage.setItem("line_templates", JSON.stringify(t)); } catch {}
  };

  const send = async () => {
    if (!message.trim()) return;
    setSending(true);
    const ids = targets.map(t => t.lineUserId).filter(Boolean);
    await onSend(ids, message);
    setSending(false);
    onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000 }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.45)", backdropFilter:"blur(4px)" }} onClick={onClose}/>
      <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", background:"#fff", borderRadius:20, padding:24, width:"min(480px, 94vw)", boxShadow:"0 8px 40px rgba(0,0,0,.18)", maxHeight:"90vh", overflow:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div style={{ fontSize:16, fontWeight:700 }}>📨 傳送 LINE 通知</div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#aaa" }}>×</button>
        </div>
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12, color:"#888", marginBottom:6, fontWeight:600 }}>收件人（{targets.length} 人）</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {targets.map((t,i)=>(
              <span key={i} style={{ fontSize:12, background:"#eaede8", color:"#3d4a3e", padding:"3px 10px", borderRadius:99 }}>{t.name}</span>
            ))}
          </div>
        </div>
        <div style={{ marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div style={{ fontSize:12, color:"#888", fontWeight:600 }}>快速範本（可編輯）</div>
            <button onClick={()=>{ setTemplates([...templates,"新範本"]); saveTemplates([...templates,"新範本"]); }}
              style={{ fontSize:11, background:"#eaede8", border:"none", borderRadius:99, padding:"3px 10px", cursor:"pointer", color:"#3d4a3e" }}>+ 新增</button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {templates.map((t,i)=>(
              <div key={i} style={{ display:"flex", gap:6 }}>
                {editingTpl===i
                  ?<div style={{ flex:1, display:"flex", gap:6 }}>
                    <input value={tplInput} onChange={e=>setTplInput(e.target.value)} style={{ flex:1, background:"#f5f3ef", border:"1.5px solid #a0614a", borderRadius:8, padding:"6px 10px", fontSize:12, outline:"none" }}/>
                    <button onClick={()=>{ const t2=[...templates];t2[i]=tplInput;saveTemplates(t2);setEditingTpl(null); }} style={{ background:"#a0614a", color:"#fff", border:"none", borderRadius:8, padding:"0 10px", fontSize:12, cursor:"pointer" }}>儲存</button>
                    <button onClick={()=>setEditingTpl(null)} style={{ background:"#f5f3ef", border:"none", borderRadius:8, padding:"0 8px", fontSize:12, cursor:"pointer", color:"#888" }}>取消</button>
                  </div>
                  :<><button onClick={()=>setMessage(t)} style={{ flex:1, textAlign:"left", background:"#f5f3ef", border:"1.5px solid #e2dbd2", borderRadius:10, padding:"8px 12px", fontSize:12, color:"#4a4438", cursor:"pointer", lineHeight:1.5 }}>{t}</button>
                    <button onClick={()=>{ setTplInput(t);setEditingTpl(i); }} style={{ background:"none", border:"1px solid #e2dbd2", borderRadius:8, padding:"0 8px", fontSize:12, cursor:"pointer", color:"#888" }}>✏️</button>
                    <button onClick={()=>{ const t2=templates.filter((_,j)=>j!==i);saveTemplates(t2); }} style={{ background:"none", border:"none", fontSize:14, cursor:"pointer", color:"#ccc" }}>×</button>
                  </>
                }
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, color:"#888", marginBottom:6, fontWeight:600 }}>自訂訊息 *</div>
          <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={5}
            placeholder="輸入要傳送給客人的 LINE 訊息內容..."
            style={{ width:"100%", background:"#fdfaf7", border:"1.5px solid #e2dbd2", borderRadius:12, padding:"11px 14px", fontSize:13, color:"#1e1a14", resize:"vertical", fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}
            onFocus={e=>e.target.style.borderColor="#8b5e3c"} onBlur={e=>e.target.style.borderColor="#e2dbd2"}
          />
          <div style={{ fontSize:11, color:"#c0b8ac", marginTop:4 }}>{message.length} 字</div>
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ background:"transparent", border:"1.5px solid #e2dbd2", borderRadius:99, padding:"9px 20px", fontSize:13, cursor:"pointer", color:"#8a8070" }}>取消</button>
          <button onClick={send} disabled={sending||!message.trim()}
            style={{ background:sending||!message.trim()?"#c0b8ac":"#8b5e3c", color:"#fff", border:"none", borderRadius:99, padding:"9px 24px", fontSize:13, fontWeight:600, cursor:sending||!message.trim()?"not-allowed":"pointer" }}>
            {sending?"發送中...":`發送給 ${targets.length} 人`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 付款欄位元件 ────────────────────────────────────────────────
function PaymentFields({ order: o, setData, toast }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    payment_method: o.payment_method || "",
    bank_code:      o.bank_code || "",
    payment_date:   o.payment_date || "",
    ship_date:      o.ship_date || "",
    shipping_fee:   String(o.shipping_fee || ""),
    deposit:        String(o.deposit || ""),
    deposit_paid:   o.deposit_paid || false,
    final_paid:     o.final_paid || false,
  });

  const total = o.total || 0;
  const liveShipping = Number(form.shipping_fee) || 0;
  const liveDeposit  = Number(form.deposit) || 0;
  const liveFinal    = Math.max(0, total + liveShipping - liveDeposit);

  const save = async () => {
    const updateData = {
      ...form,
      shipping_fee:   Number(form.shipping_fee) || 0,
      deposit:        Number(form.deposit) || 0,
      final_payment:  Math.max(0, total + (Number(form.shipping_fee)||0) - (Number(form.deposit)||0)),
    };
    // 訂金/尾款已收 → 自動跳到「待採買」(若狀態還在採買前)
    const beforePurchase = !o.status || ["pending_review", "cancelled"].includes(o.status);
    if ((form.deposit_paid || form.final_paid) && beforePurchase) {
      updateData.status = "pending";
    }
    const { error } = await supabase.from("orders").update(updateData).eq("id", o.id);
    if (!error) {
      setData(d => ({ ...d, orders: d.orders.map(x => x.id === o.id ? { ...x, ...updateData } : x) }));
      setEditing(false);
      if (updateData.status === "pending" && toast) toast("✅ 款項已收，訂單更新為「待採買」");
    } else {
      if (toast) toast("儲存失敗，請稍後再試");
    }
  };

  // 顯示模式
  if (!editing) return (
    <button onClick={() => { setForm({ payment_method:o.payment_method||"", bank_code:o.bank_code||"", payment_date:o.payment_date||"", ship_date:o.ship_date||"", shipping_fee:String(o.shipping_fee||""), deposit:String(o.deposit||""), deposit_paid:o.deposit_paid||false, final_paid:o.final_paid||false }); setEditing(true); }}
      style={{ fontSize:11, background:"none", border:`1px solid ${C.border}`, borderRadius:99, padding:"3px 12px", cursor:"pointer", color:C.muted, display:"block" }}>
      ✏️ 編輯付款資訊
    </button>
  );

  return (
    <div style={{ background:C.surface, borderRadius:12, padding:"14px", display:"flex", flexDirection:"column", gap:10, border:`1px solid ${C.border}` }}>
      <div style={{ fontSize:12, fontWeight:600, color:C.textMid }}>編輯付款資訊</div>

      {/* 付款方式 */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        <div>
          <div style={{ fontSize:11, color:C.muted, marginBottom:3 }}>付款方式</div>
          <select value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value, bank_code: e.target.value !== "transfer" ? "" : p.bank_code }))}
            style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 8px", fontSize:12 }}>
            <option value="">請選擇</option>
            <option value="transfer">匯款</option>
            <option value="cod">貨到付款</option>
          </select>
        </div>
        {form.payment_method === "transfer" && (
          <div>
            <div style={{ fontSize:11, color:C.muted, marginBottom:3 }}>後五碼</div>
            <input value={form.bank_code} onChange={e => setForm(p => ({ ...p, bank_code: e.target.value.slice(0,5) }))} placeholder="12345" maxLength={5}
              style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 8px", fontSize:12 }}/>
          </div>
        )}
        <div>
          <div style={{ fontSize:11, color:C.muted, marginBottom:3 }}>收款日期</div>
          <input type="date" value={form.payment_date} onChange={e => setForm(p => ({ ...p, payment_date: e.target.value }))}
            style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 8px", fontSize:12 }}/>
        </div>
        <div>
          <div style={{ fontSize:11, color:C.muted, marginBottom:3 }}>出貨日期</div>
          <input type="date" value={form.ship_date} onChange={e => setForm(p => ({ ...p, ship_date: e.target.value }))}
            style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 8px", fontSize:12 }}/>
        </div>
      </div>

      {/* 訂金 / 運費 / 尾款 */}
      <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:10 }}>
        <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:8 }}>訂金 / 尾款</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
          <div>
            <div style={{ fontSize:11, color:C.muted, marginBottom:3 }}>訂金 NT$</div>
            <input type="number" value={form.deposit} onChange={e => setForm(p => ({ ...p, deposit: e.target.value }))} placeholder="0"
              style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 8px", fontSize:12 }}/>
          </div>
          <div>
            <div style={{ fontSize:11, color:C.muted, marginBottom:3 }}>國際運費 NT$</div>
            <input type="number" value={form.shipping_fee} onChange={e => setForm(p => ({ ...p, shipping_fee: e.target.value }))} placeholder="0"
              style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 8px", fontSize:12 }}/>
          </div>
        </div>

        {/* 尾款計算 */}
        {(liveDeposit > 0 || liveShipping > 0) && (
          <div style={{ background:C.bgDeep, borderRadius:8, padding:"10px 12px", fontSize:12, marginBottom:8 }}>
            <div style={{ display:"flex", justifyContent:"space-between", color:C.muted, marginBottom:2 }}><span>商品總額</span><span>{fmtMoney(total)}</span></div>
            <div style={{ display:"flex", justifyContent:"space-between", color:C.muted, marginBottom:2 }}><span>運費</span><span>+{fmtMoney(liveShipping)}</span></div>
            <div style={{ display:"flex", justifyContent:"space-between", color:C.muted, marginBottom:6 }}><span>訂金</span><span>-{fmtMoney(liveDeposit)}</span></div>
            <div style={{ display:"flex", justifyContent:"space-between", fontWeight:700, color:C.accentDark, borderTop:`1px solid ${C.border}`, paddingTop:5 }}>
              <span>尾款</span><span>{fmtMoney(liveFinal)}</span>
            </div>
          </div>
        )}

        {/* 訂金/尾款 checkbox */}
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
            <input type="checkbox" checked={form.deposit_paid} onChange={e => setForm(p => ({ ...p, deposit_paid: e.target.checked }))} style={{ width:16, height:16, accentColor:C.green }}/>
            <span style={{ fontSize:12 }}>✅ 訂金已收到</span>
            {form.deposit_paid && liveDeposit > 0 && <span style={{ fontSize:11, color:C.green }}>{fmtMoney(liveDeposit)}</span>}
          </label>
          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
            <input type="checkbox" checked={form.final_paid} onChange={e => setForm(p => ({ ...p, final_paid: e.target.checked }))} style={{ width:16, height:16, accentColor:C.accent }}/>
            <span style={{ fontSize:12 }}>✅ 尾款已收到</span>
            {form.final_paid && <span style={{ fontSize:11, color:C.accent }}>{fmtMoney(liveFinal)} → 自動更新待採買</span>}
          </label>
        </div>
      </div>

      <div style={{ display:"flex", gap:8, paddingTop:4 }}>
        <button onClick={save} style={{ background:C.accent, color:"#fff", border:"none", borderRadius:8, padding:"7px 18px", fontSize:12, fontWeight:600, cursor:"pointer" }}>儲存</button>
        <button onClick={() => setEditing(false)} style={{ background:C.bgDeep, border:`1px solid ${C.border}`, borderRadius:8, padding:"7px 14px", fontSize:12, cursor:"pointer", color:C.muted }}>取消</button>
      </div>
    </div>
  );
}

// ─── 封存頁面 ─────────────────────────────────────────────────────
// ─── 配貨頁面 ────────────────────────────────────────────────────
// ─── 配貨頁面（重新設計）────────────────────────────────────────
// ─── 配貨頁面 ─────────────────────────────────────────────────────
function ArchivePage({ data, setData, toast }) {
  const [filter, setFilter] = useState("all");
  const archived = Array.from(new Map(data.orders.map(o=>[o.id,o])).values()).filter(o => o.archived);
  const filtered = archived.filter(o => filter === "all" || o.status === filter);

  const unarchive = async (id) => {
    const { error } = await supabase.from("orders").update({ archived: false, archived_at: null }).eq("id", id);
    if (!error) { setData(d => ({ ...d, orders: d.orders.map(o => o.id === id ? { ...o, archived: false, archived_at: null } : o) })); toast("已取消封存"); }
  };

  const deleteOne = async (id) => {
    if (!window.confirm("確定永久刪除？此操作無法復原。")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (!error) { setData(d => ({ ...d, orders: d.orders.filter(o => o.id !== id) })); toast("已刪除"); }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontWeight:700, fontSize:16, color:C.accentDark }}>📦 封存訂單（{archived.length} 筆）</div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={()=>{
            if(!archived.length){toast("沒有封存訂單");return;}
            exportCSV(archived, `封存訂單_${new Date().toLocaleDateString("zh-TW").replace(/\//g,"-")}.csv`);
            toast("已匯出 📊");
          }} style={{ background:C.green, color:"#fff", border:"none", borderRadius:99, padding:"7px 16px", fontSize:12, fontWeight:600, cursor:"pointer" }}>📊 匯出</button>
          {archived.length > 0 && (
            <button onClick={async()=>{
              if(!window.confirm(`確定永久刪除全部 ${archived.length} 筆？`))return;
              const ids=archived.map(o=>o.id);
              await supabase.from("orders").delete().in("id",ids);
              setData(d=>({...d,orders:d.orders.filter(o=>!ids.includes(o.id))}));
              toast("已全部清除");
            }} style={{ background:C.redBg, color:C.red, border:`1px solid ${C.red}40`, borderRadius:99, padding:"7px 16px", fontSize:12, fontWeight:600, cursor:"pointer" }}>全部刪除</button>
          )}
        </div>
      </div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {["all",...Object.keys(ORDER_STATUS)].map(s=>{
          const count=s==="all"?archived.length:archived.filter(o=>o.status===s).length;
          if(count===0&&s!=="all")return null;
          return <button key={s} onClick={()=>setFilter(s)} style={{ padding:"5px 12px", borderRadius:99, fontSize:11, fontWeight:600, cursor:"pointer", border:`1.5px solid ${filter===s?C.accent:C.border}`, background:filter===s?C.accentBg:"transparent", color:filter===s?C.accentDark:C.muted }}>{s==="all"?"全部":ORDER_STATUS[s]?.label}（{count}）</button>;
        })}
      </div>
      {!filtered.length
        ?<Card style={{ textAlign:"center", padding:"40px 0" }}><div style={{ fontSize:32, marginBottom:8 }}>📭</div><div style={{ color:C.muted }}>沒有封存訂單</div></Card>
        :filtered.map(o=>(
          <Card key={o.id} style={{ opacity:.9 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:12, color:C.muted }}>#{o.no}</span>
                  <StatusBadge status={o.status}/>
                  {o.archived_at&&<span style={{ fontSize:11, color:C.faint }}>封存於 {new Date(o.archived_at).toLocaleDateString("zh-TW")}</span>}
                </div>
                <div style={{ fontWeight:600 }}>{o.customer_name||o.customerName}</div>
                <div style={{ marginTop:6, display:"flex", flexWrap:"wrap", gap:4 }}>
                  {(o.items||[]).map((it,idx)=>(
                    <div key={idx} style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <div style={{ width:24, height:24, borderRadius:5, background:C.bgDeep, flexShrink:0, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>
                        {it.image?.startsWith("data:")||it.image?.startsWith("http")
                          ?<img src={it.image} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>e.target.style.display="none"}/>
                          :it.image||"🛒"}
                      </div>
                      <span style={{ fontSize:11, color:C.muted }}>{it.name} ×{it.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontWeight:700, color:C.accentDark }}>{fmtMoney(o.total)}</div>
              </div>
            </div>
            <div style={{ display:"flex", gap:8, paddingTop:10, borderTop:`1px solid ${C.border}` }}>
              <button onClick={()=>unarchive(o.id)} style={{ fontSize:12, background:C.bgDeep, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 14px", cursor:"pointer", color:C.textMid }}>↩ 取消封存</button>
              <button onClick={()=>deleteOne(o.id)} style={{ fontSize:12, background:C.redBg, border:"none", borderRadius:8, padding:"6px 14px", cursor:"pointer", color:C.red, fontWeight:600 }}>🗑 刪除</button>
            </div>
          </Card>
        ))
      }
    </div>
  );
}

// ─── ERP 訂單流程頁 ──────────────────────────────────────────────
function AuditLogPage() {
  const ACTION_ICON = {
    "登入成功": "✅", "登入失敗": "❌", "手動登出": "🚪",
    "Session 逾時自動登出": "⏰", "匯出CSV": "📊",
    "登入後台": "🔓", "帳號密碼已更新": "🔐",
  };
  const getIcon = (action) => {
    for (const [key, icon] of Object.entries(ACTION_ICON)) {
      if (action.includes(key)) return icon;
    }
    return "📝";
  };
  const isAlert = (action) => action.includes("失敗") || action.includes("逾時") || action.includes("鎖定");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: C.accentDark }}>🛡️ 操作日誌</div>
        <span style={{ fontSize: 12, color: C.muted, background: C.bgDeep, padding: "4px 12px", borderRadius: 99 }}>最近 {auditLog.length} 筆</span>
      </div>

      <div style={{ background: C.yellowBg, border: `1.5px solid ${C.yellow}30`, borderRadius: 12, padding: "11px 14px", fontSize: 12, color: C.textMid, lineHeight: 1.7 }}>
        ⚠️ 日誌僅保存於本次 Session，登出後清除。正式部署請串接後端 logging 系統。
      </div>

      {auditLog.length === 0 && (
        <div style={{ textAlign: "center", padding: 32, color: C.muted }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          還沒有操作記錄
        </div>
      )}

      {auditLog.map(log => (
        <div key={log.id} style={{
          background: isAlert(log.action) ? C.redBg : C.surface,
          border: `1.5px solid ${isAlert(log.action) ? C.red + "40" : C.border}`,
          borderRadius: 12, padding: "12px 16px",
          display: "flex", alignItems: "flex-start", gap: 12,
        }}>
          <div style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{getIcon(log.action)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: isAlert(log.action) ? C.red : C.text }}>{log.action}</div>
            {log.detail && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{log.detail}</div>}
          </div>
          <div style={{ fontSize: 11, color: C.muted, flexShrink: 0, textAlign: "right" }}>{log.time}</div>
        </div>
      ))}
    </div>
  );
}

function SettingsPage({ credentials, setCredentials, toast, onLogout }) {
  const [account, setAccount] = useState(credentials.account);
  const [oldPw, setOldPw] = useState(""); const [newPw, setNewPw] = useState(""); const [confirmPw, setConfirmPw] = useState("");
  const [showOld, setShowOld] = useState(false); const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");
  const [strength, setStrength] = useState(0); // 0-4

  // Password strength checker
  const checkStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8)  score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return Math.min(score, 4);
  };

  const STRENGTH_LABEL = ["", "弱", "普通", "強", "非常強"];
  const STRENGTH_COLOR = ["", C.red, C.yellow, C.blue, C.green];

  const save = async () => {
    setError("");
    const cleanAccount = sanitize(account, 50);
    if (!cleanAccount)                     return setError("帳號不可為空或含特殊字元");
    if (cleanAccount.length < 3)           return setError("帳號至少 3 個字元");
    if (newPw.length < 8)                  return setError("新密碼至少 8 個字元");
    if (!/[A-Za-z]/.test(newPw))          return setError("新密碼必須包含英文字母");
    if (!/[0-9]/.test(newPw))             return setError("新密碼必須包含數字");
    if (newPw !== confirmPw)               return setError("新密碼與確認密碼不一致");
    if (newPw === oldPw)                   return setError("新密碼不可與目前密碼相同");

    // [FIX] Hash-based comparison — never compare plaintext passwords
    const [oldHash, storedHash] = await Promise.all([
      hashPassword(oldPw),
      hashPassword(credentials.password),
    ]);
    if (oldHash !== storedHash) return setError("目前密碼錯誤");

    logAction("帳號密碼已更新", `帳號變更為：${cleanAccount}`);
    setCredentials({ account: cleanAccount, password: newPw });
    setOldPw(""); setNewPw(""); setConfirmPw(""); setStrength(0);
    toast("帳號密碼已更新，請重新登入 🔐");
    setTimeout(onLogout, 1500);
  };

  const PwRow = ({ label, value, onChange, show, toggle, onChangeExtra }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12, color: C.muted, fontWeight: 700, letterSpacing: .5, textTransform: "uppercase" }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input type={show ? "text" : "password"} value={value}
          onChange={e => { onChange(e.target.value); if (onChangeExtra) onChangeExtra(e.target.value); setError(""); }}
          maxLength={128}
          style={{ width: "100%", background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "9px 40px 9px 13px", color: C.text, fontSize: 14 }}
          onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 3px ${C.accent}15`; }}
          onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }} />
        <button onClick={toggle} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.muted, fontSize: 15, cursor: "pointer" }}>{show ? "🙈" : "👁"}</button>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 16, color: C.accentDark }}>🔐 帳號密碼設定</div>
      <Card>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 16, padding: "10px 14px", background: C.yellowBg, borderRadius: 10, borderLeft: `3px solid ${C.yellow}` }}>⚠️ 修改後將自動登出，需重新輸入新密碼</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="帳號（至少 3 字元）" value={account} onChange={v => { setAccount(sanitize(v)); setError(""); }} placeholder="輸入新帳號" />
          <PwRow label="目前密碼" value={oldPw} onChange={setOldPw} show={showOld} toggle={() => setShowOld(p => !p)} />
          <div>
            <PwRow label="新密碼（至少 8 字元，含英文+數字）" value={newPw} onChange={setNewPw} show={showNew} toggle={() => setShowNew(p => !p)}
              onChangeExtra={v => setStrength(checkStrength(v))} />
            {newPw && (
              <div style={{ marginTop: 8, display: "flex", gap: 4, alignItems: "center" }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: i <= strength ? STRENGTH_COLOR[strength] : C.faint, transition: "background .2s" }} />
                ))}
                <span style={{ fontSize: 11, color: STRENGTH_COLOR[strength], fontWeight: 700, marginLeft: 6 }}>{STRENGTH_LABEL[strength]}</span>
              </div>
            )}
          </div>
          <PwRow label="確認新密碼" value={confirmPw} onChange={setConfirmPw} show={showNew} toggle={() => setShowNew(p => !p)} />
          {error && <div style={{ background: C.redBg, border: `1.5px solid ${C.red}30`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.red, fontWeight: 600 }}>⚠️ {error}</div>}
          <Btn onClick={save} disabled={strength < 2 && newPw.length > 0}>儲存設定</Btn>
          {strength < 2 && newPw.length > 0 && <div style={{ fontSize: 12, color: C.muted, textAlign: "center" }}>密碼強度不足，請加長或增加複雜度</div>}
        </div>
      </Card>
      <Card style={{ background: C.bgDeep }}>
        <div style={{ fontWeight: 700, marginBottom: 10, color: C.accentDark }}>目前帳號資訊</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.muted }}>帳號</span><span style={{ fontWeight: 600 }}>{credentials.account}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.muted }}>密碼</span><span style={{ fontWeight: 600, letterSpacing: 3 }}>{"●".repeat(Math.min(credentials.password.length, 12))}</span></div>
        </div>
      </Card>
      {/* Security tips */}
      <Card style={{ background: C.blueBg, border: `1.5px solid ${C.blue}30` }}>
        <div style={{ fontWeight: 700, marginBottom: 10, color: C.blue }}>🛡️ 密碼安全建議</div>
        <div style={{ fontSize: 12, color: C.textMid, lineHeight: 2 }}>
          ✅ 至少 12 個字元<br/>
          ✅ 混合大小寫英文<br/>
          ✅ 包含數字和特殊符號（如 !@#$）<br/>
          ❌ 避免使用生日、電話、常用詞
        </div>
      </Card>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────
export default function AdminRoot() {
  injectStyles();
  const [data, setData] = useState(() => {
    let savedRate = INIT_DATA.rate;
    try {
      const v = localStorage.getItem("exchange_rate_jpy");
      if (v && !isNaN(Number(v))) savedRate = Number(v);
    } catch(e) {}
    return { ...INIT_DATA, rate: savedRate };
  });
  const [credentials, setCredentials] = useState({ account: "admin", password: "1234" });
  const [loggedIn, setLoggedIn] = useState(false);

  if (!loggedIn) return <LoginPage credentials={credentials} onSuccess={() => setLoggedIn(true)} />;
  return <AdminDashboard data={data} setData={setData} credentials={credentials} setCredentials={setCredentials} onLogout={() => setLoggedIn(false)} />;
}
