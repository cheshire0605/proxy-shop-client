import { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { C } from "../theme";

const IDLE_WARN_MS = 25 * 60 * 1000;  // 25 分警告
const IDLE_OUT_MS  = 30 * 60 * 1000;  // 30 分自動登出

const NAV = [
  { to: "/admin/orders",       label: "訂單管理", icon: "📋" },
  { to: "/admin/distribution", label: "配貨採買", icon: "🛒" },
  { to: "/admin/customers",    label: "客人",     icon: "👤" },
  { to: "/admin/products",     label: "賣場",     icon: "🏪" },
  { to: "/admin/categories",   label: "分類管理", icon: "🗂️" },
  { to: "/admin/announcements", label: "公告管理", icon: "📢" },
  { to: "/admin/wishlist",     label: "許願清單", icon: "⭐" },
  { to: "/admin/instock",      label: "現貨/庫存", icon: "📦" },
  { to: "/admin/stocklog",     label: "庫存異動", icon: "📊" },
  { to: "/admin/revenue",      label: "營收報表", icon: "📈" },
  { to: "/admin/export",       label: "匯出報表", icon: "📄" },
  { to: "/admin/archive",      label: "封存區",   icon: "📦" },
  { to: "/admin/settings",     label: "帳號設定", icon: "⚙️" },
  { to: "/admin/auditlog",     label: "操作日誌", icon: "🛡️" },
];

export function AdminLayout(){
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [idleWarn, setIdleWarn] = useState(false);
  const logout = async () => { try { await supabase.auth.signOut({ scope: "local" }); } catch {} navigate("/admin"); window.location.reload(); };

  // 閒置自動登出：25 分警告、30 分登出（任何操作重置）
  const resetIdleRef = useRef(()=>{});
  useEffect(()=>{
    let warnT, outT; const warnShown = { v:false };
    const reset = () => {
      if (warnShown.v) { warnShown.v = false; setIdleWarn(false); }
      clearTimeout(warnT); clearTimeout(outT);
      warnT = setTimeout(()=>{ warnShown.v = true; setIdleWarn(true); }, IDLE_WARN_MS);
      outT  = setTimeout(()=>{ logout(); }, IDLE_OUT_MS);
    };
    resetIdleRef.current = reset;
    const evts = ["mousemove","keydown","click","touchstart","scroll"];
    evts.forEach(e=>window.addEventListener(e, reset, { passive:true }));
    reset();
    return ()=>{ clearTimeout(warnT); clearTimeout(outT); evts.forEach(e=>window.removeEventListener(e, reset)); };
  }, []);

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text}}>
      {/* 頂列：漢堡 + 標題 */}
      <div style={{display:"flex",alignItems:"center",gap:14,padding:"12px 18px",background:C.surface,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:10}}>
        <button onClick={()=>setOpen(true)} aria-label="開啟選單" style={{border:"none",background:"none",fontSize:22,cursor:"pointer",lineHeight:1,color:C.textMid,padding:4}}>☰</button>
        <div style={{fontSize:16,fontWeight:700,letterSpacing:.5,color:C.accent}}>代購後台</div>
      </div>

      {/* 閒置警告 */}
      {idleWarn && (
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 18px",background:C.amberBg,borderBottom:`1px solid ${C.amber}`,color:C.amber,fontSize:13,position:"sticky",top:53,zIndex:9}}>
          <span>已閒置一段時間，5 分鐘後將自動登出。</span>
          <button onClick={()=>resetIdleRef.current()} style={{marginLeft:"auto",background:C.amber,color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>繼續工作</button>
        </div>
      )}

      {/* 左側抽屜 + 遮罩 */}
      {open && (
        <div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,background:"rgba(44,31,23,.4)",zIndex:50}}>
          <div onClick={e=>e.stopPropagation()} style={{position:"absolute",left:0,top:0,bottom:0,width:280,maxWidth:"82%",background:C.surface,padding:"18px 14px",boxShadow:"2px 0 24px rgba(44,31,23,.18)",overflowY:"auto",display:"flex",flexDirection:"column"}}>
            {/* 抽屜標題 */}
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px 18px",borderBottom:`1px solid ${C.borderLight}`,marginBottom:12}}>
              <span style={{fontSize:20}}>🏷️</span>
              <span style={{fontSize:17,fontWeight:700,color:C.accent}}>代購後台</span>
              <button onClick={()=>setOpen(false)} aria-label="收合選單" style={{marginLeft:"auto",width:34,height:34,borderRadius:8,border:"none",background:C.bgDeep,color:C.muted,fontSize:15,cursor:"pointer"}}>✕</button>
            </div>
            {/* 選單 */}
            <nav style={{display:"flex",flexDirection:"column",gap:4}}>
              {NAV.map(n=>(
                <NavLink key={n.to} to={n.to} onClick={()=>setOpen(false)} style={({isActive})=>({
                  display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:12,textDecoration:"none",fontSize:15,
                  fontWeight:isActive?700:500, color:isActive?"#fff":C.textMid, background:isActive?C.accent:"transparent",
                })}>
                  <span style={{fontSize:20,width:24,textAlign:"center"}}>{n.icon}</span>
                  <span>{n.label}</span>
                </NavLink>
              ))}
            </nav>
            {/* 登出 */}
            <button onClick={logout} style={{marginTop:"auto",display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:12,border:"none",background:"transparent",color:C.muted,fontSize:15,cursor:"pointer",textAlign:"left"}}>
              <span style={{fontSize:20,width:24,textAlign:"center"}}>🚪</span><span>登出</span>
            </button>
          </div>
        </div>
      )}

      {/* 內容 */}
      <div style={{maxWidth:1100,margin:"0 auto",padding:"24px 20px 80px"}}>
        <Outlet/>
      </div>
    </div>
  );
}
