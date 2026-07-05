import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { C } from "../../theme";
import { fmtMoney } from "../../utils";
import { ORDER_LABEL } from "../adminUtils";

const lastTime = c => Math.max(...c.orders.map(o=>new Date(o.created_at||0).getTime()), 0);

export function CustomersPage(){
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openKey, setOpenKey] = useState(null);

  const load = async () => {
    setLoading(true);
    const [{ data:orders }, { data:members }] = await Promise.all([
      supabase.from("orders").select("*, items:order_items(*)").order("created_at",{ascending:false}),
      supabase.from("members").select("*"),
    ]);
    const memberBy = {}; (members||[]).forEach(m=>{ memberBy[m.line_user_id]=m; });
    const map = {};
    (orders||[]).filter(o=>!o.archived).forEach(o=>{
      const key = o.customer_line_id || o.customer_name || "unknown";
      if (!map[key]) map[key] = { key, name:o.customer_name||"匿名", member:memberBy[key]||null, orders:[] };
      map[key].orders.push(o);
    });
    setCustomers(Object.values(map).sort((a,b)=>lastTime(b)-lastTime(a)));
    setLoading(false);
  };
  useEffect(()=>{ load(); }, []);

  const filtered = customers.filter(c => {
    const s = search.trim();
    return !s || c.name.includes(s) || (c.member?.community_name||"").includes(s) || (c.member?.phone||"").includes(s);
  });

  const infoRow = (k,v) => v ? <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, padding:"3px 0" }}><span style={{ color:C.muted }}>{k}</span><span style={{ color:C.text }}>{v}</span></div> : null;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12, maxWidth:720 }}>
      <div style={{ fontWeight:700, fontSize:16, color:C.accentDark }}>客人管理（{customers.length} 位）</div>

      <div style={{ position:"relative" }}>
        <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:15, color:C.muted, pointerEvents:"none" }}>🔍</span>
        <input value={search} onChange={e=>{setSearch(e.target.value);setOpenKey(null);}} placeholder="搜尋 名稱 / 社群名 / 電話…"
          style={{ width:"100%", background:C.bg, border:`1.5px solid ${C.border}`, borderRadius:10, padding:"9px 14px 9px 36px", color:C.text, fontSize:14, boxSizing:"border-box" }}/>
      </div>
      {search && <div style={{ fontSize:13, color:C.muted }}>找到 {filtered.length} 位</div>}

      {loading ? <div style={{ color:C.muted, padding:20 }}>載入中…</div> :
       filtered.length===0 ? <div style={{ textAlign:"center", padding:"36px 0", color:C.muted, background:C.surface, borderRadius:C.r }}><div style={{ fontSize:32, marginBottom:8 }}>👤</div>{search?`找不到「${search}」`:"還沒有客人（客人下單後自動出現）"}</div> :
       filtered.map(c=>{
        const active = c.orders.filter(o=>o.status!=="cancelled");
        const total = active.reduce((s,o)=>s+(Number(o.total)||0),0);
        const isOpen = openKey===c.key;
        return (
        <div key={c.key} style={{ background:C.surface, border:`1.5px solid ${isOpen?C.accent:C.border}`, borderRadius:18, overflow:"hidden", boxShadow:isOpen?C.shadowMd:C.shadow }}>
          <div onClick={()=>setOpenKey(isOpen?null:c.key)} style={{ padding:"14px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:44, height:44, borderRadius:"50%", background:C.accentBg, color:C.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:700, flexShrink:0 }}>{(c.name||"?").slice(0,1)}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:15, fontWeight:600, color:C.text }}>{c.name}{c.member?.community_name?<span style={{ fontSize:12, color:C.muted, marginLeft:6 }}>@{c.member.community_name}</span>:null}</div>
              <div style={{ fontSize:12, color:C.muted }}>{c.orders.length} 張訂單 · 累計 {fmtMoney(total)}</div>
            </div>
            <div style={{ fontSize:12, color:C.muted }}>{isOpen?"▲":"▼"}</div>
          </div>

          {isOpen && (
            <div style={{ borderTop:`1px solid ${C.borderLight}`, background:C.bgDeep, padding:"14px 16px" }}>
              {/* 會員資料 */}
              <div style={{ background:C.surface, borderRadius:12, padding:"10px 14px", marginBottom:12 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.accentDark, marginBottom:6 }}>會員資料</div>
                {c.member ? (<>
                  {infoRow("社群名", c.member.community_name)}
                  {infoRow("IG/Threads", c.member.ig_threads)}
                  {infoRow("收件人", c.member.recipient_name)}
                  {infoRow("電話", c.member.phone)}
                  {infoRow("7-11 門市", c.member.seven_store)}
                  {infoRow("LINE ID", c.member.line_id)}
                </>) : <div style={{ fontSize:13, color:C.faint }}>此客人尚未填寫會員資料</div>}
              </div>
              {/* 訂單清單 */}
              <div style={{ fontSize:12, fontWeight:700, color:C.accentDark, marginBottom:6 }}>訂單（{c.orders.length}）</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {c.orders.map(o=>(
                  <div key={o.id} style={{ display:"flex", alignItems:"center", gap:10, background:C.surface, borderRadius:10, padding:"8px 12px" }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13 }}>#{o.no} <span style={{ color:C.faint, fontSize:11 }}>{o.created_at?new Date(o.created_at).toLocaleDateString("zh-TW"):""}</span></div>
                      <div style={{ fontSize:11, color:C.muted }}>{(o.items||[]).length} 項 · {ORDER_LABEL[o.status]||o.status}</div>
                    </div>
                    <div style={{ fontSize:13, fontWeight:600, color:o.status==="cancelled"?C.faint:C.accentDark, textDecoration:o.status==="cancelled"?"line-through":"none" }}>{fmtMoney(o.total)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}
