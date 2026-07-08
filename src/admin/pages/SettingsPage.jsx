import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { C } from "../../theme";
import { logAction } from "../auditLog";

const card = { background:C.surface, borderRadius:C.r, boxShadow:C.shadow, padding:20 };
const secTitle = { fontWeight:700, fontSize:16, color:C.accentDark, marginTop:4 };
const inp = { width:"100%", background:C.bg, border:`1.5px solid ${C.border}`, borderRadius:10, padding:"9px 13px", color:C.text, fontSize:14, boxSizing:"border-box" };
const lab = { fontSize:12, color:C.muted, fontWeight:700, letterSpacing:.5, display:"block", marginBottom:6 };
const primaryBtn = (extra={}) => ({ background:C.accent, color:"#fff", border:"none", borderRadius:10, padding:"11px", fontSize:14, fontWeight:600, cursor:"pointer", ...extra });

const checkStrength = (pw) => {
  let s=0;
  if(pw.length>=8)s++; if(pw.length>=12)s++;
  if(/[A-Z]/.test(pw)&&/[a-z]/.test(pw))s++;
  if(/[0-9]/.test(pw))s++; if(/[^A-Za-z0-9]/.test(pw))s++;
  return Math.min(s,4);
};
const STRENGTH_LABEL = ["","弱","普通","強","非常強"];
const STRENGTH_COLOR = ["",C.red,C.amber,C.blue,C.green];

export function SettingsPage(){
  const [email, setEmail] = useState("");
  const [jpyRate, setJpyRate] = useState("");
  const [shopeeUrl, setShopeeUrl] = useState("");
  const [autoCancelHours, setAutoCancelHours] = useState("36");
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");   // 哪個區塊儲存中
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState(""); const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwErr, setPwErr] = useState("");
  const [toast, setToast] = useState("");
  const flash = m => { setToast(m); setTimeout(()=>setToast(""), 2600); };
  const strength = checkStrength(newPw);

  useEffect(()=>{
    supabase.auth.getUser().then(({data})=>{ if(data?.user?.email) setEmail(data.user.email); });
    Promise.all([
      supabase.from("settings").select("value").eq("key","jpy_rate").maybeSingle(),
      supabase.from("settings").select("value").eq("key","shopee_ship_url").maybeSingle(),
      supabase.from("settings").select("value").eq("key","auto_cancel_hours").maybeSingle(),
    ]).then(([r,s,c])=>{
      if(r.data?.value) setJpyRate(String(r.data.value));
      if(s.data?.value) setShopeeUrl(s.data.value);
      if(c.data?.value) setAutoCancelHours(String(c.data.value));
      setLoading(false);
    }).catch(()=>setLoading(false));
  },[]);

  const saveSetting = async (key, value, okMsg) => {
    setSavingKey(key);
    const { error } = await supabase.from("settings").upsert([{ key, value:String(value) }], { onConflict:"key" });
    setSavingKey("");
    if (error) { flash("儲存失敗："+error.message); return; }
    logAction("更新設定", `${key} = ${value}`);
    flash(okMsg);
  };
  const saveRate = () => saveSetting("jpy_rate", Number(jpyRate)||0, "匯率已儲存 ✅");
  const saveShopee = () => saveSetting("shopee_ship_url", shopeeUrl.trim(), "賣貨便連結已儲存 ✅");
  const saveCancel = () => { const h=Math.max(1,Math.min(720,Number(autoCancelHours)||36)); setAutoCancelHours(String(h)); saveSetting("auto_cancel_hours", h, `已設定 ${h} 小時後自動取消 ✅`); };

  const savePassword = async () => {
    setPwErr("");
    if (!currentPw) return setPwErr("請輸入目前密碼");
    if (newPw.length<8) return setPwErr("新密碼至少 8 個字元");
    if (!/[A-Za-z]/.test(newPw)) return setPwErr("新密碼必須包含英文字母");
    if (!/[0-9]/.test(newPw)) return setPwErr("新密碼必須包含數字");
    if (strength<2) return setPwErr("密碼強度不足（至少要「普通」）");
    if (newPw===currentPw) return setPwErr("新密碼不可與目前密碼相同");
    if (newPw!==confirmPw) return setPwErr("新密碼與確認密碼不一致");
    setSavingKey("pw");
    // 先用目前密碼重新驗證，確認是本人
    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password:currentPw });
    if (authErr) { setSavingKey(""); return setPwErr("目前密碼不正確"); }
    const { error } = await supabase.auth.updateUser({ password:newPw });
    setSavingKey("");
    if (error) { setPwErr("更新失敗："+error.message); return; }
    logAction("帳號密碼已更新");
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    flash("密碼已更新 🔐");
  };

  return (
    <div style={{ maxWidth:560 }}>
      <h2 style={{ fontSize:20, fontWeight:700, margin:"0 0 16px" }}>帳號設定</h2>
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

        {/* 匯率 */}
        <div style={secTitle}>💱 匯率設定</div>
        <div style={card}>
          <div style={{ fontSize:13, color:C.muted, marginBottom:12, lineHeight:1.7 }}>全域日幣匯率，影響商品成本的「日幣 × 匯率」預設計算。</div>
          <label style={lab}>匯率 ¥1 = NT$</label>
          <input type="number" value={jpyRate} onChange={e=>setJpyRate(e.target.value)} placeholder="例如 0.23" style={{ ...inp, marginBottom:12 }} disabled={loading}/>
          <button onClick={saveRate} disabled={savingKey==="jpy_rate"||loading} style={primaryBtn({width:"100%"})}>{savingKey==="jpy_rate"?"儲存中…":"儲存匯率"}</button>
        </div>

        {/* 出貨設定 */}
        <div style={secTitle}>📦 出貨設定</div>
        <div style={card}>
          <div style={{ fontSize:13, color:C.muted, marginBottom:12, lineHeight:1.7 }}>這個連結會出現在客人「出貨頁」的結單按鈕，客人點下去會開啟此網址。留空則客人看不到結單按鈕。</div>
          <label style={lab}>賣貨便商店連結</label>
          <input value={shopeeUrl} onChange={e=>setShopeeUrl(e.target.value)} placeholder="https://shopee.tw/m/你的賣貨便網址" style={{ ...inp, marginBottom:12 }} disabled={loading}/>
          <button onClick={saveShopee} disabled={savingKey==="shopee_ship_url"||loading} style={primaryBtn({width:"100%"})}>{savingKey==="shopee_ship_url"?"儲存中…":"儲存連結"}</button>
        </div>

        {/* 自動取消 */}
        <div style={secTitle}>⏰ 訂單自動取消</div>
        <div style={card}>
          <div style={{ fontSize:13, color:C.muted, marginBottom:12, lineHeight:1.7 }}>客人下單後，超過此時間仍在「待審核」，系統將自動取消並回補現貨庫存。</div>
          <label style={lab}>逾期取消時數</label>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <input type="number" min="1" max="720" value={autoCancelHours} onChange={e=>setAutoCancelHours(e.target.value)} style={{ ...inp, flex:1 }} disabled={loading}/>
            <span style={{ fontSize:14, color:C.text, fontWeight:500 }}>小時</span>
          </div>
          <div style={{ fontSize:11, color:C.muted, margin:"6px 0 10px" }}>建議 24–72 小時，最短 1 小時、最長 30 天(720)</div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
            {[12,24,36,48,72].map(h=>{
              const on = autoCancelHours===String(h);
              return <button key={h} onClick={()=>setAutoCancelHours(String(h))} style={{ padding:"5px 12px", borderRadius:99, border:`1px solid ${on?C.accent:C.border}`, background:on?C.accent:"transparent", color:on?"#fff":C.textMid, fontSize:12, cursor:"pointer" }}>{h}h</button>;
            })}
          </div>
          <button onClick={saveCancel} disabled={savingKey==="auto_cancel_hours"||loading} style={primaryBtn({width:"100%"})}>{savingKey==="auto_cancel_hours"?"儲存中…":"儲存時數"}</button>
        </div>

        {/* 帳號密碼 */}
        <div style={secTitle}>🔐 帳號密碼</div>
        <div style={card}>
          <div style={{ fontSize:13, color:C.amber, marginBottom:16, padding:"10px 14px", background:C.amberBg, borderRadius:10, borderLeft:`3px solid ${C.amber}` }}>⚠️ 帳號登入採 Supabase Auth，此處可更改登入密碼。</div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div><label style={lab}>目前帳號（Email）</label><input value={email} disabled style={{ ...inp, background:C.bgDeep, color:C.muted }}/></div>
            <div><label style={lab}>目前密碼</label><input type={showPw?"text":"password"} value={currentPw} onChange={e=>{setCurrentPw(e.target.value);setPwErr("");}} placeholder="輸入現在的密碼以驗證身分" style={inp}/></div>
            <div>
              <label style={lab}>新密碼（至少 8 字元，含英文+數字）</label>
              <div style={{ position:"relative" }}>
                <input type={showPw?"text":"password"} value={newPw} onChange={e=>{setNewPw(e.target.value);setPwErr("");}} maxLength={128} style={{ ...inp, paddingRight:40 }}/>
                <button onClick={()=>setShowPw(v=>!v)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:C.muted, fontSize:15, cursor:"pointer" }}>{showPw?"🙈":"👁"}</button>
              </div>
              {newPw && (
                <div style={{ marginTop:8, display:"flex", gap:4, alignItems:"center" }}>
                  {[1,2,3,4].map(i=><div key={i} style={{ flex:1, height:4, borderRadius:99, background:i<=strength?STRENGTH_COLOR[strength]:C.faint }}/>)}
                  <span style={{ fontSize:11, color:STRENGTH_COLOR[strength], fontWeight:700, marginLeft:6 }}>{STRENGTH_LABEL[strength]}</span>
                </div>
              )}
            </div>
            <div><label style={lab}>確認新密碼</label><input type={showPw?"text":"password"} value={confirmPw} onChange={e=>{setConfirmPw(e.target.value);setPwErr("");}} style={inp}/></div>
            {pwErr && <div style={{ background:C.redBg, border:`1.5px solid ${C.red}30`, borderRadius:10, padding:"10px 14px", fontSize:13, color:C.red, fontWeight:600 }}>⚠️ {pwErr}</div>}
            <button onClick={savePassword} disabled={savingKey==="pw"||!newPw||!currentPw} style={primaryBtn({width:"100%",opacity:(savingKey==="pw"||!newPw||!currentPw)?.6:1})}>{savingKey==="pw"?"更新中…":"更新密碼"}</button>
          </div>
        </div>

        {/* 安全建議 */}
        <div style={{ ...card, background:C.blueBg, border:`1.5px solid ${C.blue}30` }}>
          <div style={{ fontWeight:700, marginBottom:10, color:C.blue }}>🛡️ 密碼安全建議</div>
          <div style={{ fontSize:12, color:C.textMid, lineHeight:2 }}>✅ 至少 12 個字元<br/>✅ 混合大小寫英文<br/>✅ 包含數字和特殊符號（如 !@#$）<br/>❌ 避免生日、電話、常用詞</div>
        </div>
      </div>

      {toast && <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", background:C.text, color:"#fff", padding:"11px 22px", borderRadius:99, fontSize:13, zIndex:200, boxShadow:C.shadow }}>{toast}</div>}
    </div>
  );
}
