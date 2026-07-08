import { C } from "../theme";

// 後台共用樣式（原本散在各頁重複定義）
export const th = { textAlign:"left", padding:"10px 12px", fontSize:12, color:C.muted, fontWeight:600, whiteSpace:"nowrap", borderBottom:`1px solid ${C.border}` };
export const td = { padding:"10px 12px", fontSize:13, borderBottom:`1px solid ${C.borderLight}`, whiteSpace:"nowrap" };
export const inp = { width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:C.rSm, fontSize:13, boxSizing:"border-box", background:"#fff" };
export const label = { fontSize:11, color:C.muted, display:"block", marginBottom:4 };

// 後台共用彈窗
export function Modal({ onClose, children, maxWidth = 420 }){
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(44,31,23,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:16}} onClick={onClose}>
      <div style={{background:C.surface,borderRadius:C.r,padding:24,width:"100%",maxWidth,maxHeight:"90vh",overflow:"auto"}} onClick={e=>e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
