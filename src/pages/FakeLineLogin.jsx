import { C } from "../theme";
import { APP_NAME } from "../constants";
import { FAKE_ACCOUNTS } from "../devFakeAccounts";

// 本地開發用的「假 LINE 登入」畫面：
// 選一個假帳號登入 = 模擬「以某個 LINE 客人登入」。正式版換成真 LINE 登入。
export function FakeLineLogin({ onPick, onGuest }){
  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:24,padding:32}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:11,letterSpacing:4,color:C.faint,textTransform:"uppercase",marginBottom:14}}>Dev Login</div>
        <div style={{fontSize:28,fontWeight:300,color:C.text,letterSpacing:4}}>{APP_NAME}</div>
        <div style={{width:32,height:1,background:C.accent,margin:"14px auto 0"}}/>
        <div style={{fontSize:12,color:C.muted,marginTop:12}}>本地開發：模擬 LINE 登入（選一個測試客人）</div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:10,width:"100%",maxWidth:300}}>
        {FAKE_ACCOUNTS.map(a=>(
          <button key={a.key} onClick={()=>onPick(a)}
            style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:"#06C755",color:"#fff",border:"none",borderRadius:14,padding:"13px 20px",fontSize:15,fontWeight:600,cursor:"pointer",letterSpacing:.5,boxShadow:"0 4px 16px rgba(6,199,85,.2)"}}>
            以 {a.name} 登入
          </button>
        ))}
        <button onClick={onGuest}
          style={{background:"transparent",color:C.muted,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"11px 20px",fontSize:13,cursor:"pointer",marginTop:4}}>
          以訪客身分（匿名）進入
        </button>
      </div>

      <div style={{fontSize:11,color:C.faint,textAlign:"center",lineHeight:1.7,maxWidth:300}}>
        正式版此頁會換成真正的 LINE 登入。<br/>假帳號需先在 Supabase 建立，或關閉 Email 確認以自動建立。
      </div>
    </div>
  );
}
