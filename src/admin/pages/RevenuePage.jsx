import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { C } from "../../theme";
import { fmtMoney } from "../../utils";
import { downloadCSV } from "../adminUtils";
import { logAction } from "../auditLog";

export function RevenuePage(){
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("month");

  useEffect(()=>{
    supabase.from("orders").select("*, items:order_items(*)").then(({data})=>{ setOrders(data||[]); setLoading(false); });
  }, []);

  const now = new Date();
  const startToday = () => { const d=new Date(now); d.setHours(0,0,0,0); return d.getTime(); };
  const startWeek  = () => { const d=new Date(now); d.setHours(0,0,0,0); const day=d.getDay()||7; d.setDate(d.getDate()-day+1); return d.getTime(); };
  const startMonth = () => new Date(now.getFullYear(),now.getMonth(),1).getTime();
  const inRange = (o) => {
    if (!o.created_at) return range==="all";
    const t = new Date(o.created_at).getTime();
    if (range==="today") return t>=startToday();
    if (range==="week")  return t>=startWeek();
    if (range==="month") return t>=startMonth();
    return true;
  };

  const scoped = orders.filter(o=>!o.archived && inRange(o));
  const valid = scoped.filter(o=>o.status!=="cancelled");
  const revenue = valid.reduce((s,o)=>s+(Number(o.total)||0),0);
  const profit = valid.reduce((s,o)=>s+(Number(o.profit)||0),0);
  const cost = revenue - profit;               // 成本 = 營收 − 利潤（成本明細不外流）
  const avg = valid.length ? Math.round(revenue/valid.length) : 0;

  // 商品銷量排行（成本已隱藏，只看銷量/營收）
  const prodMap = new Map();
  valid.forEach(o=>(o.items||[]).forEach(it=>{
    const name = it.product_name || "—";
    const p = prodMap.get(name) || { name, qty:0, revenue:0 };
    p.qty += Number(it.qty)||1; p.revenue += (Number(it.price)||0)*(Number(it.qty)||1);
    prodMap.set(name, p);
  }));
  const topProducts = [...prodMap.values()].sort((a,b)=>b.revenue-a.revenue).slice(0,8);

  // 客人排行
  const custMap = new Map();
  valid.forEach(o=>{ const k=o.customer_line_id||o.customer_name||"匿名"; const c=custMap.get(k)||{name:o.customer_name||"匿名",count:0,revenue:0}; c.count++; c.revenue+=Number(o.total)||0; custMap.set(k,c); });
  const topCustomers = [...custMap.values()].sort((a,b)=>b.revenue-a.revenue).slice(0,8);

  // 月度趨勢（近 12 月，不受 range 影響）
  const monMap = new Map();
  orders.filter(o=>!o.archived && o.status!=="cancelled" && o.created_at).forEach(o=>{
    const d=new Date(o.created_at); const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    const m=monMap.get(k)||{month:k,revenue:0,profit:0,orders:0}; m.revenue+=Number(o.total)||0; m.profit+=Number(o.profit)||0; m.orders++; monMap.set(k,m);
  });
  const months = [...monMap.values()].sort((a,b)=>a.month.localeCompare(b.month)).slice(-12);
  const maxRev = Math.max(1, ...months.map(m=>m.revenue));

  const exportCSV = () => {
    const esc = v => { const s=String(v??""); return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s; };
    const rows = [["#訂單","日期","客人","狀態","營收","成本","利潤"]];
    scoped.forEach(o=>rows.push(["#"+(o.no||""), o.created_at?new Date(o.created_at).toLocaleDateString("zh-TW"):"", o.customer_name||"", o.status, Number(o.total)||0, (Number(o.total)||0)-(Number(o.profit)||0), Number(o.profit)||0]));
    rows.push([]); rows.push(["合計","","","",revenue,cost,profit]);
    downloadCSV(`營收報表_${range}_${new Date().toLocaleDateString("zh-TW").replace(/\//g,"-")}.csv`, "﻿"+rows.map(r=>r.map(esc).join(",")).join("\n"));
    logAction("匯出營收報表", range);
  };

  const kpi = (lab,val,color) => (
    <div style={{ flex:1, minWidth:130, background:C.surface, borderRadius:C.r, boxShadow:C.shadow, padding:"16px 18px" }}>
      <div style={{ fontSize:12, color:C.muted, marginBottom:6 }}>{lab}</div>
      <div style={{ fontSize:20, fontWeight:700, color:color||C.text }}>{val}</div>
    </div>
  );
  const rangePill = (k,l) => <button key={k} onClick={()=>setRange(k)} style={{ padding:"6px 14px", borderRadius:99, fontSize:13, cursor:"pointer", border:"none", fontWeight:range===k?600:400, background:range===k?C.accent:C.bgDeep, color:range===k?"#fff":C.textMid }}>{l}</button>;
  const rankRow = (rank,name,main,sub) => (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid ${C.borderLight}` }}>
      <div style={{ width:22, height:22, borderRadius:"50%", background:rank<=3?C.accent:C.bgDeep, color:rank<=3?"#fff":C.muted, fontSize:11, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{rank}</div>
      <div style={{ flex:1, minWidth:0, fontSize:13, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{name}</div>
      <div style={{ textAlign:"right", flexShrink:0 }}><div style={{ fontSize:13, fontWeight:600 }}>{main}</div><div style={{ fontSize:11, color:C.muted }}>{sub}</div></div>
    </div>
  );

  if (loading) return <div style={{ color:C.muted, padding:20 }}>載入中…</div>;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, maxWidth:800 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        <div style={{ fontWeight:700, fontSize:16, color:C.accentDark }}>📊 營收報表</div>
        <button onClick={exportCSV} style={{ marginLeft:"auto", background:C.green, color:"#fff", border:"none", borderRadius:99, padding:"7px 16px", fontSize:12, fontWeight:600, cursor:"pointer" }}>📊 匯出 CSV</button>
      </div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {rangePill("today","今日")}{rangePill("week","本週")}{rangePill("month","本月")}{rangePill("all","全部")}
      </div>

      {/* KPI */}
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        {kpi("營收", fmtMoney(revenue), C.accentDark)}
        {kpi("成本", fmtMoney(cost), C.amber)}
        {kpi("利潤", fmtMoney(profit), C.green)}
        {kpi("有效訂單", valid.length)}
        {kpi("客單價", fmtMoney(avg))}
      </div>

      {/* 月度趨勢 */}
      <div style={{ background:C.surface, borderRadius:C.r, boxShadow:C.shadow, padding:18 }}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>月度趨勢（近 12 月營收）</div>
        {months.length===0 ? <div style={{ color:C.faint, fontSize:13 }}>尚無資料</div> :
         <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:120 }}>
          {months.map(m=>(
            <div key={m.month} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }} title={`${m.month} 營收 ${fmtMoney(m.revenue)}`}>
              <div style={{ width:"100%", background:C.accentBg, borderRadius:"6px 6px 0 0", height:`${Math.max(4,(m.revenue/maxRev)*90)}px`, display:"flex", alignItems:"flex-start", justifyContent:"center" }}>
                <div style={{ width:"100%", background:C.accent, borderRadius:"6px 6px 0 0", height:"100%" }}/>
              </div>
              <div style={{ fontSize:9, color:C.muted, transform:"rotate(-45deg)", whiteSpace:"nowrap", marginTop:4 }}>{m.month.slice(2)}</div>
            </div>
          ))}
         </div>}
      </div>

      {/* 排行 */}
      <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
        <div style={{ flex:"1 1 320px", background:C.surface, borderRadius:C.r, boxShadow:C.shadow, padding:18 }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>🏆 商品營收排行</div>
          {topProducts.length===0 ? <div style={{ color:C.faint, fontSize:13 }}>尚無資料</div> :
           topProducts.map((p,i)=>rankRow(i+1, p.name, fmtMoney(p.revenue), `售 ${p.qty} 件`))}
        </div>
        <div style={{ flex:"1 1 320px", background:C.surface, borderRadius:C.r, boxShadow:C.shadow, padding:18 }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>👑 客人消費排行</div>
          {topCustomers.length===0 ? <div style={{ color:C.faint, fontSize:13 }}>尚無資料</div> :
           topCustomers.map((c,i)=>rankRow(i+1, c.name, fmtMoney(c.revenue), `${c.count} 張`))}
        </div>
      </div>
    </div>
  );
}
