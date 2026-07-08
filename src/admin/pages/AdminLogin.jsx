import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { C } from "../../theme";

// 前端登入限流：連錯 5 次鎖 5 分鐘（存 localStorage，重整仍有效）。
// 註：這只是 UI 便利防護；真正的登入節流由 Supabase Auth 伺服器端把關。
const LOCK_KEY = "admin_login_lock";
const MAX_FAILS = 5, LOCK_MS = 5 * 60 * 1000;
const readLock  = () => { try { return JSON.parse(localStorage.getItem(LOCK_KEY)) || { fails:0, lockUntil:0 }; } catch { return { fails:0, lockUntil:0 }; } };
const writeLock = (v) => localStorage.setItem(LOCK_KEY, JSON.stringify(v));

// 業者後台登入（Supabase Auth：email + 密碼）
export function AdminLogin({ notAdmin }){
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockLeft, setLockLeft] = useState(Math.max(0, Math.ceil((readLock().lockUntil - Date.now())/1000)));
  const [attemptsLeft, setAttemptsLeft] = useState(Math.max(0, MAX_FAILS - readLock().fails));

  // 鎖定倒數
  useEffect(()=>{
    if (lockLeft <= 0) return;
    const t = setInterval(()=>{ setLockLeft(Math.max(0, Math.ceil((readLock().lockUntil - Date.now())/1000))); }, 1000);
    return ()=>clearInterval(t);
  }, [lockLeft]);

  const login = async () => {
    if (readLock().lockUntil > Date.now()) return;  // 鎖定中，擋下
    setErr(""); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      const fails = (readLock().fails || 0) + 1;
      const locked = fails >= MAX_FAILS;
      writeLock({ fails: locked ? 0 : fails, lockUntil: locked ? Date.now()+LOCK_MS : 0 });
      setAttemptsLeft(Math.max(0, MAX_FAILS - fails));
      if (locked) setLockLeft(Math.ceil(LOCK_MS/1000));
      setErr(error.message || "登入失敗");
      return;
    }
    writeLock({ fails:0, lockUntil:0 });  // 成功清除
  };

  const locked = lockLeft > 0;
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
        {locked && (
          <div style={{fontSize:12,color:C.red,background:C.redBg,padding:"10px 12px",borderRadius:8,marginBottom:16,lineHeight:1.6}}>
            🔒 登入嘗試過多，請於 {Math.floor(lockLeft/60)}:{String(lockLeft%60).padStart(2,"0")} 後再試。
          </div>
        )}
        {!locked && attemptsLeft < MAX_FAILS && (
          <div style={{fontSize:12,color:C.amber,background:C.amberBg,padding:"8px 12px",borderRadius:8,marginBottom:12}}>⚠️ 剩餘 {attemptsLeft} 次登入機會</div>
        )}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <input style={inp} type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} disabled={locked}/>
          <input style={inp} type="password" placeholder="密碼" value={password} onChange={e=>setPassword(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&!locked&&login()} disabled={locked}/>
          {err && <div style={{fontSize:12,color:C.red,background:C.redBg,padding:"8px 12px",borderRadius:8}}>{err}</div>}
          <button onClick={login} disabled={loading||locked}
            style={{background:C.accent,color:"#fff",border:"none",borderRadius:99,padding:"12px",fontSize:14,fontWeight:600,cursor:(loading||locked)?"not-allowed":"pointer",opacity:(loading||locked)?.5:1}}>
            {loading?"登入中…":locked?"已鎖定":"登入"}
          </button>
        </div>
        <div style={{fontSize:11,color:C.faint,marginTop:16,lineHeight:1.6}}>
          帳號需先在 Supabase 後台 → Authentication → Users 建立。
        </div>
      </div>
    </div>
  );
}
