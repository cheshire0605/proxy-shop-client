import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { C } from "../theme";
import { fmtMoney } from "../utils";
import { orderStage } from "./adminUtils";

// 後台共用統計卡（總訂單 / 待採買 / 已採買 / 預估利潤）
export function StatsHeader(){
  const [s, setS] = useState({ total:0, toPurchase:0, purchased:0, profit:0 });
  useEffect(()=>{
    supabase.from("orders").select("status, shipping_status, profit, archived, items:order_items(qty, allocated_qty, purchase_status)").then(({data})=>{
      const os = (data || []).filter(o=>!o.archived);   // 與訂單頁一致，排除已封存
      let toPurchase=0, purchased=0, profit=0;
      os.forEach(o=>{ const st=orderStage(o); if(st==="to_purchase")toPurchase++; if(st==="purchased")purchased++; profit+=Number(o.profit)||0; });
      setS({ total:os.length, toPurchase, purchased, profit });
    });
  }, []);
  const card = (icon,val,lab,active) => (
    <div style={{flex:1,minWidth:150,background:active?C.accent:C.surface,color:active?"#fff":C.text,borderRadius:C.r,boxShadow:C.shadow,padding:"18px 20px",textAlign:"center"}}>
      <div style={{fontSize:16,opacity:.7}}>{icon}</div>
      <div style={{fontSize:24,fontWeight:700,margin:"4px 0"}}>{val}</div>
      <div style={{fontSize:12,opacity:.8}}>{lab}</div>
    </div>
  );
  return (
    <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
      {card("📋", s.total, "總訂單", true)}
      {card("🕐", s.toPurchase, "待採買")}
      {card("✓", s.purchased, "已採買")}
      {card("＄", fmtMoney(s.profit), "預估利潤")}
    </div>
  );
}
