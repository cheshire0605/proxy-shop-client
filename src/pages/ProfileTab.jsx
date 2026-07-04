import { useState, useEffect } from "react";
import { C } from "../theme";
import { Card, Btn, Field } from "../components/ui";
import { sanitize } from "../utils";
import { supabase } from "../supabase";

// ─── 個人資料 Tab ─────────────────────────────────────────────────
export function ProfileTab({member,setMember,lineUser,setToast,forced=false}){
  const [form,setForm]=useState({community_name:"",line_id:"",ig_threads:"",recipient_name:"",phone:"",seven_store:""});
  const [saving,setSaving]=useState(false);
  const [err,setErr]=useState("");

  useEffect(()=>{
    if(member?.line_user_id)setForm({community_name:member.community_name||"",line_id:member.line_id||"",ig_threads:member.ig_threads||"",recipient_name:member.recipient_name||"",phone:member.phone||"",seven_store:member.seven_store||""});
  },[member]);

  const save=async()=>{
    setErr("");
    if(!form.community_name.trim()){setErr("請填寫社群名稱");return;}
    if(!form.ig_threads.trim()){setErr("請填寫 IG / FB 連結");return;}
    if(!form.recipient_name.trim()){setErr("請填寫收件人姓名");return;}
    if(!form.phone.trim()){setErr("請填寫電話");return;}
    for(const k of ["line_id","ig_threads","phone"]){ const m=fmtErr(k); if(m){ setErr(m); return; } }
    setSaving(true);
    const updated={line_user_id:lineUser.userId,line_name:lineUser.name,community_name:sanitize(form.community_name,100),line_id:sanitize(form.line_id,100),ig_threads:sanitize(form.ig_threads,200),recipient_name:sanitize(form.recipient_name,50),phone:sanitize(form.phone,20),seven_store:sanitize(form.seven_store,100),updated_at:new Date().toISOString()};
    try{
      const{error,data:savedRows}=await supabase.from("members").upsert([updated],{onConflict:"line_user_id"}).select();
      if(error)throw error;
      // 確認真的有寫入(回傳 0 筆 = RLS 擋住,但沒報錯)
      if(!savedRows||savedRows.length===0){
        throw new Error("資料未寫入(可能是權限設定問題,請聯絡客服)");
      }
      setMember(savedRows[0]||updated);
      setToast(forced?"歡迎加入,開始逛賣場吧 🎉":"資料已儲存 ✅");
    }catch(e){
      console.error("儲存失敗:",e);
      const msg=e?.message||"未知錯誤";
      setErr(`儲存失敗:${msg}`);
    }
    setSaving(false);
  };

  // 格式驗證（回傳錯誤訊息；空字串=通過）。空值交給「必填」判斷，這裡只驗有填的。
  const FORMAT={
    line_id:    v => /^[A-Za-z0-9._-]{4,20}$/.test(v) ? "" : "LINE ID：4–20 字，僅英數與 . _ -",
    ig_threads: v => /(instagram\.com|facebook\.com|fb\.com|threads\.(net|com))/i.test(v) ? "" : "請貼 Instagram / Facebook / Threads 連結",
    phone:      v => /^09\d{8}$/.test(v) ? "" : "手機須為 09 開頭、共 10 碼數字",
  };
  const fmtErr = key => { const v=(form[key]||"").trim(); return v && FORMAT[key] ? FORMAT[key](v) : ""; };

  const FIELDS=[
    {key:"community_name",label:"社群名稱 *",placeholder:"OpenChat 顯示名稱",req:true},
    {key:"line_id",label:"LINE ID",placeholder:"你的 LINE ID"},
    {key:"ig_threads",label:"私人 IG / FB 連結 *",placeholder:"https://www.instagram.com/...",req:true},
    {key:"recipient_name",label:"收件人姓名 *",placeholder:"取件時的姓名",req:true},
    {key:"phone",label:"電話 *",placeholder:"09xxxxxxxx",req:true},
    {key:"seven_store",label:"7-11 門市",placeholder:"常用門市名稱"},
  ];

  return(
    <div style={{padding:"20px 16px 100px"}}>
      {forced&&(
        <div style={{padding:"14px 16px",background:C.accent,color:"#fff",borderRadius:C.rSm,marginBottom:18,boxShadow:C.shadow}}>
          <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>👋 歡迎,{lineUser.name}!</div>
          <div style={{fontSize:12,lineHeight:1.6,opacity:.95}}>首次使用請先填寫個人資料,完成後即可開始下單。後續可在「我的」隨時修改。</div>
        </div>
      )}
      {/* 頭像區 */}
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:24}}>
        <div style={{width:56,height:56,borderRadius:"50%",background:C.accentBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>
          {lineUser.pictureUrl?<img src={lineUser.pictureUrl} style={{width:56,height:56,borderRadius:"50%",objectFit:"cover"}}/>:"👤"}
        </div>
        <div>
          <div style={{fontSize:17,fontWeight:600,color:C.text}}>{lineUser.name}</div>
          <div style={{fontSize:12,color:C.muted,marginTop:2,letterSpacing:.3}}>社群名稱務必填寫正確，改名也請到系統更改</div>
        </div>
      </div>

      <Card style={{padding:"20px"}}>
        <div style={{fontSize:13,color:C.muted,marginBottom:20,lineHeight:1.7}}>
          <span style={{color:C.red,fontWeight:500}}>*</span> 為必填欄位
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {FIELDS.map(f=>(
            <div key={f.key}>
              <Field label={f.label} placeholder={f.placeholder} value={form[f.key]} onChange={v=>setForm(p=>({...p,[f.key]:v}))}/>
              {f.req&&!form[f.key].trim()
                ? <div style={{fontSize:11,color:C.red,marginTop:3}}>必填</div>
                : fmtErr(f.key)?<div style={{fontSize:11,color:C.red,marginTop:3}}>{fmtErr(f.key)}</div>:null}
            </div>
          ))}
        </div>
        {err&&<div style={{fontSize:12,color:C.red,marginTop:14,padding:"10px 14px",background:C.redBg,borderRadius:C.rSm}}>{err}</div>}
        <Btn full onClick={save} disabled={saving} style={{marginTop:20}}>{saving?"儲存中...":"儲存資料"}</Btn>
      </Card>
    </div>
  );
}
