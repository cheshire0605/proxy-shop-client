import { useState } from "react";
import { supabase } from "../../supabase";
import { C } from "../../theme";

// 業者後台登入（Supabase Auth：email + 密碼）
export function AdminLogin({ notAdmin }){
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setErr(""); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) { setErr(error.message || "登入失敗"); return; }
    // 成功後 onAuthStateChange 會更新畫面
  };

  const inp = { width:"100%", padding:"11px 14px", border:`1.5px solid ${C.border}`, borderRadius:C.rSm, fontSize:14, boxSizing:"border-box" };

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{width:"100%",maxWidth:360,background:C.surface,borderRadius:C.r,boxShadow:C.shadow,padding:"32px 28px"}}>
        <div style={{fontSize:20,fontWeight:700,color:C.accent,textAlign:"center",marginBottom:6}}>代購後台</div>
        <div style={{fontSize:12,color:C.muted,textAlign:"center",marginBottom:24}}>業者登入</div>
        {notAdmin && (
          <div style={{fontSize:12,color:C.red,background:C.redBg,padding:"10px 12px",borderRadius:8,marginBottom:16,lineHeight:1.6}}>
            目前登入的帳號沒有後台權限，請改用業者帳號登入。
            <button onClick={()=>supabase.auth.signOut({ scope: "local" })} style={{display:"block",marginTop:6,background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:12,padding:0}}>登出目前帳號</button>
          </div>
        )}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <input style={inp} type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
          <input style={inp} type="password" placeholder="密碼" value={password} onChange={e=>setPassword(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&login()}/>
          {err && <div style={{fontSize:12,color:C.red,background:C.redBg,padding:"8px 12px",borderRadius:8}}>{err}</div>}
          <button onClick={login} disabled={loading}
            style={{background:C.accent,color:"#fff",border:"none",borderRadius:99,padding:"12px",fontSize:14,fontWeight:600,cursor:loading?"not-allowed":"pointer",opacity:loading?.5:1}}>
            {loading?"登入中…":"登入"}
          </button>
        </div>
        <div style={{fontSize:11,color:C.faint,marginTop:16,lineHeight:1.6}}>
          帳號需先在 Supabase 後台 → Authentication → Users 建立。
        </div>
      </div>
    </div>
  );
}
