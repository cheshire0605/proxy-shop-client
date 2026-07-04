import { useState } from "react";
import { C } from "../theme";
import { ORDER_STATUS } from "../constants";

// ─── 共用 UI 元件 ──────────────────────────────────────────────────
export const Card = ({children,style:sx,className})=>(
  <div className={className} style={{background:C.bgCard,borderRadius:C.r,boxShadow:C.shadow,border:`1px solid ${C.borderLight}`,...sx}}>
    {children}
  </div>
);

export const Btn = ({children,onClick,variant="accent",sm,full,style:sx,disabled})=>{
  const v={
    accent:{background:C.accent,color:"#fff",border:"none"},
    outline:{background:"transparent",color:C.textMid,border:`1.5px solid ${C.border}`},
    ghost:{background:"transparent",color:C.muted,border:"none"},
    rose:{background:C.roseBg,color:C.rose,border:`1px solid ${C.rose}30`},
  };
  return(
    <button onClick={onClick} disabled={disabled} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,padding:sm?"7px 16px":"12px 24px",fontSize:sm?12:14,fontWeight:500,borderRadius:99,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.4:1,transition:"all .2s",width:full?"100%":undefined,...v[variant],...sx}}
      onMouseEnter={e=>{if(!disabled)e.currentTarget.style.opacity=".75";}}
      onMouseLeave={e=>{e.currentTarget.style.opacity=disabled?".4":"1";}}
    >{children}</button>
  );
};

export const Field = ({label,value,onChange,type="text",placeholder,readOnly,style:sx})=>(
  <div style={{display:"flex",flexDirection:"column",gap:5,...sx}}>
    {label&&<label style={{fontSize:11,color:C.muted,fontWeight:500,letterSpacing:.5}}>{label}</label>}
    <input type={type} value={value??""} onChange={e=>onChange?.(e.target.value)} placeholder={placeholder} readOnly={readOnly}
      style={{background:readOnly?C.bgDeep:C.surface,border:`1.5px solid ${C.border}`,borderRadius:C.rSm,padding:"11px 14px",color:readOnly?C.muted:C.text,fontSize:14,transition:"all .15s"}}
      onFocus={e=>{if(!readOnly){e.target.style.borderColor=C.accent;e.target.style.boxShadow=`0 0 0 3px ${C.accent}15`;}}}
      onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow="none";}}
    />
  </div>
);

export const StatusPill = ({status})=>{
  const s=ORDER_STATUS[status]||ORDER_STATUS.pending;
  return <span style={{fontSize:11,color:s.color,background:s.bg,padding:"4px 12px",borderRadius:99,fontWeight:500,whiteSpace:"nowrap",letterSpacing:.3}}>{s.label}</span>;
};

export const HR = ({style:sx})=><div style={{height:1,background:C.borderLight,...sx}}/>;

export const Toast = ({msg,onDone})=>{
  useState(()=>{const t=setTimeout(onDone,2400);return()=>clearTimeout(t);});
  return <div style={{position:"fixed",bottom:36,left:"50%",transform:"translateX(-50%)",background:C.bgDark,color:"#fdf7f4",padding:"12px 28px",borderRadius:99,fontSize:13,fontWeight:500,boxShadow:C.shadowMd,zIndex:2000,whiteSpace:"nowrap",animation:"fadeUp .2s ease",letterSpacing:.3}}>{msg}</div>;
};

export const Sheet = ({open,onClose,title,children})=>{
  if(!open)return null;
  return(
    <div style={{position:"fixed",inset:0,zIndex:500}}>
      <div style={{position:"absolute",inset:0,background:"rgba(44,31,23,.4)",backdropFilter:"blur(6px)"}} onClick={onClose}/>
      <div className="fadeUp" style={{position:"absolute",bottom:0,left:0,right:0,background:C.surface,maxHeight:"92vh",overflow:"auto",borderRadius:"28px 28px 0 0",boxShadow:C.shadowLg}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"22px 22px 18px",borderBottom:`1px solid ${C.borderLight}`}}>
          <span style={{fontSize:16,fontWeight:600,color:C.text,letterSpacing:.3}}>{title}</span>
          <button onClick={onClose} style={{background:C.bgDeep,border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:18,color:C.muted,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{padding:"22px 22px 56px"}}>{children}</div>
      </div>
    </div>
  );
};
