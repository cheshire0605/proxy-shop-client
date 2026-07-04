import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { C } from "../theme";

const NAV = [
  { to: "/admin/orders",       label: "訂單管理" },
  { to: "/admin/distribution", label: "配貨採買" },
  { to: "/admin/products",     label: "商品管理" },
  { to: "/admin/categories",   label: "分類管理" },
  { to: "/admin/stocklog",     label: "庫存異動" },
  { to: "/admin/export",       label: "匯出報表" },
];

export function AdminLayout(){
  const navigate = useNavigate();
  const logout = async () => { try { await supabase.auth.signOut({ scope: "local" }); } catch {} navigate("/admin"); window.location.reload(); };

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text}}>
      {/* 頂列 */}
      <div style={{display:"flex",alignItems:"center",gap:20,padding:"14px 24px",background:C.surface,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:10,flexWrap:"wrap"}}>
        <div style={{fontSize:16,fontWeight:700,letterSpacing:.5,color:C.accent}}>代購後台</div>
        <nav style={{display:"flex",gap:6,flex:1,flexWrap:"wrap"}}>
          {NAV.map(n=>(
            <NavLink key={n.to} to={n.to} style={({isActive})=>({
              padding:"8px 16px",borderRadius:99,fontSize:14,textDecoration:"none",fontWeight:isActive?600:400,
              color:isActive?C.accent:C.muted,background:isActive?C.accentBg:"transparent",border:`1px solid ${isActive?C.accent+"50":"transparent"}`
            })}>{n.label}</NavLink>
          ))}
        </nav>
        <button onClick={logout} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:99,padding:"7px 16px",fontSize:13,color:C.muted,cursor:"pointer"}}>登出</button>
      </div>
      {/* 內容 */}
      <div style={{maxWidth:1100,margin:"0 auto",padding:"24px 20px 80px"}}>
        <Outlet/>
      </div>
    </div>
  );
}
