import { C } from "../theme";

// ─── 公告橫幅 ──────────────────────────────────────────────────────
// 顯示業者公告（announcements）。沒有公告時不顯示任何東西。
export function AnnouncementBar({announcements}){
  if(!announcements||announcements.length===0)return null;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {announcements.map(a=>{
        const date=a.created_at?new Date(a.created_at).toLocaleDateString("zh-TW",{month:"numeric",day:"numeric"}):"";
        return(
          <div key={a.id} style={{display:"flex",alignItems:"flex-start",gap:10,background:C.accentBg,border:`1px solid ${C.accent}30`,borderRadius:C.rSm,padding:"12px 14px"}}>
            <span style={{fontSize:16,flexShrink:0,lineHeight:1.4}}>📢</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,color:C.accentDark,lineHeight:1.6,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{a.content}</div>
              {date&&<div style={{fontSize:10,color:C.muted,marginTop:4,letterSpacing:.3}}>{date}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
