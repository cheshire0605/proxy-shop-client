import { useState, useEffect } from "react";
import { C } from "../theme";
import { APP_NAME } from "../constants";
import { sanitize } from "../utils";
import { FAKE_ACCOUNTS } from "../devFakeAccounts";

// ─── LINE 登入（真 LINE + 測試帳號並存）────────────────────────────
export function LineLogin({ onSuccess, onPickFake, onGuest, showTest }){
  const [status, setStatus] = useState("loading");
  const [err, setErr] = useState("");
  const [showAccts, setShowAccts] = useState(false);

  useEffect(()=>{
    const liffId = import.meta.env.VITE_LIFF_ID;
    const sdkLoaded = typeof liff !== "undefined";
    // 沒設 LIFF ID（本地/尚未申請）→ 直接顯示按鈕，不擋畫面
    if (!liffId || !sdkLoaded) { setStatus("ready"); return; }
    liff.init({ liffId })
      .then(()=>{ if(!liff.isLoggedIn()){ liff.login(); return; } return liff.getProfile(); })
      .then(p=>{ if(!p) return; onSuccess({ name: sanitize(p.displayName,50)||"朋友", userId: p.userId, pictureUrl: p.pictureUrl, idToken: liff.getIDToken() }); })
      .catch(e=>{
        console.error("LIFF error:", e);
        setStatus("error");
        setErr(`LINE 登入失敗\n${e?.message||e?.code||String(e)}\n\n常見原因:\n• LIFF ID 錯誤（檢查環境變數 VITE_LIFF_ID）\n• Endpoint URL 跟目前網址不符（LINE Developers 後台設定）\n• LIFF 應用已停用`);
      });
  },[onSuccess]);

  const lineBtn = (
    <button onClick={()=>{
      const liffId = import.meta.env.VITE_LIFF_ID;
      if (!liffId) { alert("尚未設定 LIFF ID（VITE_LIFF_ID）"); return; }
      if (typeof liff === "undefined") { alert("LIFF SDK 未載入，請重新整理"); return; }
      if (!liff.isLoggedIn()) liff.login();
    }} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:12,background:"#06C755",color:"#fff",border:"none",borderRadius:14,padding:"14px 24px",fontSize:15,fontWeight:600,cursor:"pointer",letterSpacing:.5,boxShadow:"0 4px 16px rgba(6,199,85,.25)"}}>
      <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
      使用 LINE 登入
    </button>
  );

  const testSection = showTest && (
    <div style={{width:"100%",maxWidth:280,marginTop:4}}>
      <button onClick={()=>setShowAccts(v=>!v)} style={{width:"100%",background:"none",border:`1px dashed ${C.border}`,borderRadius:10,padding:"9px",fontSize:12,color:C.muted,cursor:"pointer"}}>🔧 測試帳號登入 {showAccts?"▲":"▼"}</button>
      {showAccts && (
        <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:8}}>
          {FAKE_ACCOUNTS.map(a=>(
            <button key={a.key} onClick={()=>onPickFake(a)} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 12px",fontSize:13,color:C.text,cursor:"pointer",textAlign:"left"}}>{a.name}</button>
          ))}
          <button onClick={onGuest} style={{background:"none",border:"none",color:C.faint,fontSize:12,cursor:"pointer",padding:"6px"}}>或以匿名訪客進入</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:28,padding:32}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:11,letterSpacing:4,color:C.faint,textTransform:"uppercase",marginBottom:14}}>Welcome</div>
        <div style={{fontSize:30,fontWeight:300,color:C.text,letterSpacing:4}}>{APP_NAME}</div>
        <div style={{width:32,height:1,background:C.accent,margin:"16px auto 0"}}/>
      </div>

      {status==="error" ? (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,maxWidth:380,width:"100%"}}>
          <div style={{fontSize:12,color:C.red,padding:"14px 18px",background:C.redBg,borderRadius:C.rSm,whiteSpace:"pre-wrap",lineHeight:1.7,width:"100%",boxSizing:"border-box"}}>{err}</div>
          <button onClick={()=>window.location.reload()} style={{background:C.accent,color:"#fff",border:"none",borderRadius:99,padding:"12px 32px",fontSize:13,fontWeight:500,cursor:"pointer"}}>重新整理</button>
          {testSection}
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:18,width:"100%",maxWidth:280}}>
          {lineBtn}
          {status==="loading" && (
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:16,height:16,borderRadius:"50%",border:`1.5px solid ${C.faint}`,borderTopColor:C.accent,animation:"spin 1s linear infinite"}}/>
              <div style={{fontSize:12,color:C.faint,letterSpacing:.5}}>自動登入中</div>
            </div>
          )}
          {testSection}
        </div>
      )}

      <div style={{position:"absolute",bottom:32,fontSize:11,color:C.faint,letterSpacing:.5}}>Powered by Luna Studio</div>
    </div>
  );
}
