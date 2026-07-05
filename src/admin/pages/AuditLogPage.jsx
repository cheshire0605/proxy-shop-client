import { useState, useEffect } from "react";
import { C } from "../../theme";
import { getAuditLog, subscribeAudit } from "../auditLog";

const ACTION_ICON = { "登入":"🔓", "登出":"🚪", "審核":"✅", "拒絕":"❌", "匯出":"📊", "密碼":"🔐", "設定":"⚙️", "封存":"📦", "刪除":"🗑" };
const getIcon = (a) => { for (const [k,i] of Object.entries(ACTION_ICON)) if (a.includes(k)) return i; return "📝"; };
const isAlert = (a) => a.includes("失敗") || a.includes("拒絕") || a.includes("刪除");

export function AuditLogPage(){
  const [logs, setLogs] = useState(getAuditLog());
  useEffect(()=> subscribeAudit(setLogs), []);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14, maxWidth:640 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontWeight:700, fontSize:16, color:C.accentDark }}>🛡️ 操作日誌</div>
        <span style={{ fontSize:12, color:C.muted, background:C.bgDeep, padding:"4px 12px", borderRadius:99 }}>最近 {logs.length} 筆</span>
      </div>
      <div style={{ background:C.amberBg, border:`1.5px solid ${C.amber}30`, borderRadius:12, padding:"11px 14px", fontSize:12, color:C.textMid, lineHeight:1.7 }}>
        ⚠️ 日誌僅保存於本次登入 Session，登出或重整後清除。正式部署可再串接後端 logging。
      </div>
      {logs.length===0 ? <div style={{ textAlign:"center", padding:32, color:C.muted }}><div style={{ fontSize:32, marginBottom:8 }}>📋</div>還沒有操作記錄</div> :
       logs.map(log=>(
        <div key={log.id} style={{ background:isAlert(log.action)?C.redBg:C.surface, border:`1.5px solid ${isAlert(log.action)?C.red+"40":C.border}`, borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"flex-start", gap:12 }}>
          <div style={{ fontSize:20, flexShrink:0, marginTop:1 }}>{getIcon(log.action)}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:600, fontSize:14, color:isAlert(log.action)?C.red:C.text }}>{log.action}</div>
            {log.detail && <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{log.detail}</div>}
          </div>
          <div style={{ fontSize:11, color:C.muted, flexShrink:0, textAlign:"right" }}>{log.time}</div>
        </div>
      ))}
    </div>
  );
}
