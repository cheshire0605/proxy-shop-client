import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { C } from "../../theme";
import { fmtMoney } from "../../utils";
import { ORDER_LABEL, STAGE_LABEL, applyStage, orderStage as stageOf } from "../adminUtils";
import { logAction } from "../auditLog";

const lastTime = c => Math.max(...c.orders.map(o=>new Date(o.created_at||0).getTime()), 0);

export function CustomersPage(){
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openKey, setOpenKey] = useState(null);
  const [openOrder, setOpenOrder] = useState(null);
  const [notes, setNotes] = useState({});        // key -> 已存備註
  const [noteDraft, setNoteDraft] = useState({}); // key -> 編輯中文字
  const [toast, setToast] = useState("");
  const flash = m => { setToast(m); setTimeout(()=>setToast(""), 2000); };

  const saveNote = async (key) => {
    const note = (noteDraft[key]||"").slice(0,500);
    const { error } = await supabase.from("customer_notes").upsert({ customer_key:key, note, updated_at:new Date().toISOString() });
    if (error) { flash("備註儲存失敗"); return; }
    setNotes(n=>({ ...n, [key]:note })); flash("備註已儲存 📝");
  };

  // LINE 通知（群發/單發＋範本）
  const DEFAULT_TPL = ["您的訂單已送出，我們會盡快處理 🌸", "您的商品已到貨，請安排取貨～", "本週日本連線開跑，歡迎下單！"];
  const [tpls, setTpls] = useState([]);
  const [notify, setNotify] = useState(null);   // null | { keys:[], label }
  const [notifyMsg, setNotifyMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState("");
  useEffect(()=>{ try { setTpls(JSON.parse(localStorage.getItem("line_templates"))||[]); } catch {} }, []);
  const openNotifyAll = () => { setNotify({ keys:customers.map(c=>c.key), label:`全體客人（${customers.length} 位）` }); setNotifyMsg(""); setSendResult(""); };
  const openNotifyOne = (c) => { setNotify({ keys:[c.key], label:c.name }); setNotifyMsg(""); setSendResult(""); };
  const saveTpl = () => { const t=notifyMsg.trim(); if(!t)return; const next=[...new Set([t,...tpls])].slice(0,10); setTpls(next); localStorage.setItem("line_templates", JSON.stringify(next)); flash("已存為範本"); };
  const sendNotify = async () => {
    if (!notifyMsg.trim()) { setSendResult("請輸入訊息"); return; }
    setSending(true); setSendResult("");
    const { data, error } = await supabase.functions.invoke("send-line", { body:{ customerIds:notify.keys, message:notifyMsg.trim() } });
    setSending(false);
    if (error) { setSendResult("發送失敗："+(error.message||error)); return; }
    if (data?.error) { setSendResult("發送失敗："+data.error); return; }
    setSendResult(`✅ 已發送 ${data.sent} 人${data.skipped?`，${data.skipped} 人未收到（未綁 LINE / 未加好友）`:""}`);
    logAction("LINE 通知", `${notify.label} · 已送 ${data.sent} 人`);
  };

  // 合併訂單（同客人多張併一張）
  const [mergeCust, setMergeCust] = useState(null);
  const [mergeSel, setMergeSel] = useState(new Set());
  const [merging, setMerging] = useState(false);
  const startMerge = (key) => { setMergeCust(key); setMergeSel(new Set()); setOpenOrder(null); };
  const cancelMerge = () => { setMergeCust(null); setMergeSel(new Set()); };
  const toggleMergeSel = (id) => setMergeSel(s=>{ const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; });
  const doMerge = async (c) => {
    const sel = c.orders.filter(o=>mergeSel.has(o.id));
    if (sel.length<2) return;
    const target = sel.reduce((a,b)=> new Date(a.created_at||0) <= new Date(b.created_at||0) ? a : b);  // 最早成立單
    const sources = sel.filter(o=>o.id!==target.id).map(o=>o.id);
    if (!window.confirm(`把 ${sel.length} 張訂單合併成 #${target.no}？來源單會刪除，品項與金額併入目標單。`)) return;
    setMerging(true);
    const { error } = await supabase.rpc("merge_orders", { p_target:target.id, p_sources:sources });
    setMerging(false);
    if (error) { flash("合併失敗："+error.message); return; }
    logAction("合併訂單", `${sel.length} 張 → #${target.no}`);
    cancelMerge(); flash("已合併 ✅"); load();
  };

  const load = async () => {
    setLoading(true);
    const [{ data:orders }, { data:members }, { data:notesData }] = await Promise.all([
      // 只抓列表/明細會用到的欄位（不整包 * 拉）
      supabase.from("orders").select("id, no, customer_line_id, customer_name, status, shipping_status, total, archived, created_at, items:order_items(id, product_name, spec, qty, price, allocated_qty, purchase_status)").order("created_at",{ascending:false}),
      supabase.from("members").select("*"),
      supabase.from("customer_notes").select("*"),
    ]);
    const noteBy = {}; (notesData||[]).forEach(n=>{ noteBy[n.customer_key]=n.note||""; });
    setNotes(noteBy); setNoteDraft(noteBy);
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
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ fontWeight:700, fontSize:16, color:C.accentDark }}>客人管理（{customers.length} 位）</div>
        <button onClick={openNotifyAll} style={{ marginLeft:"auto", background:C.green, color:"#fff", border:"none", borderRadius:99, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>📨 全體通知</button>
      </div>

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
              {notes[c.key] ? <div style={{ fontSize:11, color:C.accent, marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>📝 {notes[c.key]}</div> : null}
            </div>
            <div style={{ fontSize:12, color:C.muted }}>{isOpen?"▲":"▼"}</div>
          </div>

          {isOpen && (
            <div style={{ borderTop:`1px solid ${C.borderLight}`, background:C.bgDeep, padding:"14px 16px" }}>
              <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:10 }}>
                <button onClick={()=>openNotifyOne(c)} style={{ background:C.greenBg, color:C.green, border:"none", borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>📨 通知這位客人</button>
              </div>
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
              {/* 客人備註（僅業者可見） */}
              <div style={{ background:C.surface, borderRadius:12, padding:"10px 14px", marginBottom:12 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.accentDark, marginBottom:6 }}>📝 備註（僅業者可見）</div>
                <textarea value={noteDraft[c.key]??""} onChange={e=>setNoteDraft(d=>({ ...d, [c.key]:e.target.value }))} rows={2}
                  placeholder="電話、地址、VIP、注意事項…" maxLength={500}
                  style={{ width:"100%", background:C.bg, border:`1.5px solid ${C.border}`, borderRadius:8, padding:"8px 10px", fontSize:13, boxSizing:"border-box", resize:"vertical", fontFamily:"inherit", color:C.text }}/>
                <div style={{ display:"flex", justifyContent:"flex-end", marginTop:6 }}>
                  <button onClick={()=>saveNote(c.key)} style={{ background:C.accent, color:"#fff", border:"none", borderRadius:8, padding:"6px 16px", fontSize:12, fontWeight:600, cursor:"pointer" }}>儲存備註</button>
                </div>
              </div>
              {/* 訂單清單 */}
              <div style={{ display:"flex", alignItems:"center", marginBottom:6 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.accentDark }}>訂單（{c.orders.length}）</div>
                {c.orders.filter(o=>o.status!=="cancelled").length>=2 && (
                  <button onClick={()=> mergeCust===c.key ? cancelMerge() : startMerge(c.key)}
                    style={{ marginLeft:"auto", background:"none", border:`1px solid ${C.border}`, borderRadius:8, padding:"4px 10px", fontSize:11, color:mergeCust===c.key?C.red:C.accent, cursor:"pointer" }}>
                    {mergeCust===c.key ? "取消合併" : "🔗 合併訂單"}
                  </button>
                )}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {c.orders.map(o=>{
                  const oOpen = openOrder===o.id;
                  const inMerge = mergeCust===c.key;
                  return (
                  <div key={o.id} style={{ background:inMerge&&mergeSel.has(o.id)?C.accentBg:C.surface, border:inMerge&&mergeSel.has(o.id)?`1.5px solid ${C.accent}`:"none", borderRadius:10, overflow:"hidden" }}>
                    <div onClick={()=> inMerge ? toggleMergeSel(o.id) : setOpenOrder(oOpen?null:o.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", cursor:"pointer" }}>
                      {inMerge && <input type="checkbox" checked={mergeSel.has(o.id)} readOnly style={{ flexShrink:0 }}/>}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13 }}>#{o.no} <span style={{ color:C.faint, fontSize:11 }}>{o.created_at?new Date(o.created_at).toLocaleDateString("zh-TW"):""}</span></div>
                        <div style={{ fontSize:11, color:C.muted }}>{(o.items||[]).length} 項 · {ORDER_LABEL[o.status]||o.status} {oOpen?"▲":"▼"}</div>
                      </div>
                      <div style={{ fontSize:13, fontWeight:600, color:o.status==="cancelled"?C.faint:C.accentDark, textDecoration:o.status==="cancelled"?"line-through":"none" }}>{fmtMoney(o.total)}</div>
                    </div>
                    {oOpen && (
                      <div style={{ borderTop:`1px solid ${C.borderLight}`, background:C.bgDeep, padding:"8px 12px", display:"flex", flexDirection:"column", gap:3 }}>
                        {(o.items||[]).length===0 ? <div style={{ fontSize:12, color:C.faint }}>無品項</div> :
                         (o.items||[]).map(it=>(
                          <div key={it.id} style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.textMid, gap:8 }}>
                            <span style={{ minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{it.product_name}{it.spec?` / ${it.spec}`:""} ×{it.qty}</span>
                            <span style={{ flexShrink:0 }}>{fmtMoney((it.price||0)*(it.qty||1))}</span>
                          </div>
                        ))}
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:6, paddingTop:6, borderTop:`1px solid ${C.borderLight}` }}>
                          <span style={{ fontSize:11, color:C.muted }}>改狀態</span>
                          <select value={stageOf(o)} onClick={e=>e.stopPropagation()} onChange={async e=>{ await applyStage(o, e.target.value); load(); }}
                            style={{ padding:"4px 10px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:12, background:"#fff" }}>
                            {Object.entries(STAGE_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
              {mergeCust===c.key && (
                <button onClick={()=>doMerge(c)} disabled={mergeSel.size<2||merging}
                  style={{ width:"100%", marginTop:8, background:mergeSel.size>=2?C.accent:C.bgDeep, color:mergeSel.size>=2?"#fff":C.faint, border:"none", borderRadius:8, padding:"9px", fontSize:13, fontWeight:600, cursor:(mergeSel.size>=2&&!merging)?"pointer":"not-allowed" }}>
                  {merging?"合併中…":`合併選取的 ${mergeSel.size} 張訂單`}
                </button>
              )}
            </div>
          )}
        </div>
        );
      })}
      {notify && (
        <div onClick={()=>setNotify(null)} style={{ position:"fixed", inset:0, background:"rgba(44,31,23,.4)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:C.surface, borderRadius:16, padding:20, width:"100%", maxWidth:420, boxShadow:C.shadowMd }}>
            <div style={{ display:"flex", alignItems:"center", marginBottom:12 }}>
              <div style={{ fontSize:16, fontWeight:700 }}>📨 LINE 通知</div>
              <button onClick={()=>setNotify(null)} style={{ marginLeft:"auto", width:30, height:30, borderRadius:"50%", border:"none", background:C.bgDeep, color:C.muted, cursor:"pointer" }}>✕</button>
            </div>
            <div style={{ fontSize:12, color:C.muted, marginBottom:10 }}>收件人：<b style={{ color:C.text }}>{notify.label}</b></div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
              {[...DEFAULT_TPL, ...tpls].slice(0,8).map((t,i)=>(
                <button key={i} onClick={()=>setNotifyMsg(t)} style={{ fontSize:11, background:C.bgDeep, color:C.textMid, border:`1px solid ${C.border}`, borderRadius:99, padding:"4px 10px", cursor:"pointer", maxWidth:170, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t}</button>
              ))}
            </div>
            <textarea value={notifyMsg} onChange={e=>setNotifyMsg(e.target.value)} rows={4} maxLength={500} placeholder="輸入要發送的訊息…"
              style={{ width:"100%", border:`1.5px solid ${C.border}`, borderRadius:10, padding:"10px 12px", fontSize:13, boxSizing:"border-box", resize:"vertical", fontFamily:"inherit", color:C.text }}/>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:4 }}>
              <button onClick={saveTpl} style={{ fontSize:11, background:"none", border:"none", color:C.accent, cursor:"pointer" }}>＋ 存為範本</button>
              <span style={{ fontSize:11, color:C.faint }}>{notifyMsg.length}/500</span>
            </div>
            {sendResult && <div style={{ fontSize:12, color:sendResult.startsWith("✅")?C.green:C.red, marginTop:8 }}>{sendResult}</div>}
            <button onClick={sendNotify} disabled={sending} style={{ width:"100%", marginTop:12, background:C.green, color:"#fff", border:"none", borderRadius:99, padding:"11px", fontSize:14, fontWeight:600, cursor:sending?"not-allowed":"pointer", opacity:sending?.6:1 }}>{sending?"發送中…":`發送給 ${notify.keys.length} 人`}</button>
            <div style={{ fontSize:10, color:C.faint, marginTop:8, lineHeight:1.6 }}>需已部署 send-line 並設定 LINE_MESSAGING_TOKEN；客人需已加官方帳號好友。手動客人/未綁 LINE 者自動略過。</div>
          </div>
        </div>
      )}

      {toast && <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", background:C.text, color:"#fff", padding:"11px 22px", borderRadius:99, fontSize:13, zIndex:200, boxShadow:C.shadow }}>{toast}</div>}
    </div>
  );
}
