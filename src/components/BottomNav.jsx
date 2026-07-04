import { C } from "../theme";
import { Icon } from "./Icon";

// ─── 導覽列（底部 Tab） ────────────────────────────────────────────
export function BottomNav({tab,setTab,cartCount}){
  const ITEMS=[
    {id:"catalog",label:"商品"},
    {id:"wishlist",label:"許願"},
    {id:"orders",label:"訂單"},
    {id:"shipments",label:"出貨"},
    {id:"profile",label:"我的"},
  ];
  return(
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:C.surface,borderTop:`1px solid ${C.borderLight}`,display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom,0)"}}>
      {ITEMS.map(it=>{
        const active=tab===it.id;
        return(
          <button key={it.id} onClick={()=>setTab(it.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"10px 0 8px",background:"none",border:"none",cursor:"pointer",gap:3,position:"relative"}}>
            <div style={{position:"relative"}}>
              <Icon name={it.id} size={22} color={active?C.accent:C.faint}/>
              {it.id==="catalog"&&cartCount>0&&<span style={{position:"absolute",top:-4,right:-4,background:C.accent,color:"#fff",fontSize:8,width:14,height:14,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{cartCount}</span>}
            </div>
            <span style={{fontSize:10,color:active?C.accent:C.faint,fontWeight:active?600:400,letterSpacing:.3,transition:"color .15s"}}>{it.label}</span>
            {active&&<div style={{position:"absolute",bottom:0,width:20,height:2,background:C.accent,borderRadius:99}}/>}
          </button>
        );
      })}
    </div>
  );
}
