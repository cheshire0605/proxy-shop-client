import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { C } from "../../theme";

export function AnnouncementsPage(){
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);   // null / "new" / id
  const [content, setContent] = useState("");
  const [toast, setToast] = useState("");
  const flash = m => { setToast(m); setTimeout(()=>setToast(""), 2400); };

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("announcements").select("*").order("created_at",{ascending:false});
    setList(data || []); setLoading(false);
  };
  useEffect(()=>{ load(); }, []);

  const startNew = () => { setEditing("new"); setContent(""); };
  const startEdit = (a) => { setEditing(a.id); setContent(a.content||""); };
  const cancel = () => { setEditing(null); setContent(""); };

  const save = async () => {
    if (!content.trim()) { flash("請填寫內容"); return; }
    if (editing==="new") {
      const { error } = await supabase.from("announcements").insert([{ content: content.trim() }]);
      if (error) { flash("新增失敗："+error.message); return; }
      flash("公告已新增 📢");
    } else {
      const { error } = await supabase.from("announcements").update({ content: content.trim() }).eq("id", editing);
      if (error) { flash("更新失敗："+error.message); return; }
      flash("公告已更新 ✅");
    }
    cancel(); load();
  };
  const del = async (id) => {
    if (!window.confirm("確定刪除此公告？")) return;
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) { flash("刪除失敗："+error.message); return; }
    flash("公告已刪除"); load();
  };

  const inp = { width:"100%", background:C.bg, border:`1.5px solid ${C.border}`, borderRadius:10, padding:"10px 13px", color:C.text, fontSize:13, boxSizing:"border-box", lineHeight:1.8, resize:"vertical", fontFamily:"inherit" };
  const btn = (bg,col,extra={}) => ({ background:bg, color:col, border:"none", borderRadius:8, padding:"7px 16px", fontSize:13, fontWeight:600, cursor:"pointer", ...extra });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14, maxWidth:640 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontWeight:700, fontSize:16, color:C.accentDark }}>📢 公告管理</div>
        {editing===null && <button onClick={startNew} style={btn(C.accent,"#fff")}>＋ 新增公告</button>}
      </div>

      {/* 編輯器 */}
      {editing!==null && (
        <div style={{ background:C.surface, border:`2px solid ${C.accent}`, borderRadius:16, padding:18, display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ fontWeight:700, fontSize:14, color:C.accentDark }}>{editing==="new"?"✏️ 新增公告":"✏️ 編輯公告"}</div>
          <div>
            <label style={{ fontSize:12, color:C.muted, fontWeight:700, display:"block", marginBottom:6 }}>內容 *</label>
            <textarea value={content} onChange={e=>setContent(e.target.value)} rows={6} placeholder={"🎌 東京連線開跑！本週下單約 2 週到貨～"} style={inp}/>
            <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>可用換行和 emoji，客人端會原樣顯示</div>
          </div>
          {content && (
            <div style={{ background:C.amberBg, borderLeft:`4px solid ${C.amber}`, borderRadius:"0 10px 10px 0", padding:"12px 14px" }}>
              <div style={{ fontSize:11, color:C.amber, fontWeight:700, marginBottom:6 }}>預覽（客人端顯示效果）</div>
              <pre style={{ fontSize:12, color:C.textMid, lineHeight:1.8, whiteSpace:"pre-wrap", fontFamily:"inherit", margin:0 }}>{content}</pre>
            </div>
          )}
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button onClick={cancel} style={btn("transparent",C.muted,{border:`1px solid ${C.border}`})}>取消</button>
            <button onClick={save} style={btn(C.accent,"#fff")}>{editing==="new"?"發布公告":"儲存修改"}</button>
          </div>
        </div>
      )}

      {/* 列表 */}
      {loading ? <div style={{ color:C.muted, padding:20 }}>載入中…</div> :
       (list.length===0 && editing===null) ? <div style={{ textAlign:"center", color:C.muted, padding:32, background:C.surface, borderRadius:C.r }}><div style={{ fontSize:36, marginBottom:8 }}>📢</div>還沒有公告，點上方按鈕新增</div> :
       list.map(a=>(
        <div key={a.id} style={{ background:C.surface, border:`1.5px solid ${editing===a.id?C.accent:C.border}`, borderRadius:16, overflow:"hidden", boxShadow:C.shadow, opacity:editing!==null&&editing!==a.id?.5:1 }}>
          <div style={{ padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:10, borderBottom:`1px solid ${C.border}` }}>
            <div style={{ fontSize:11, color:C.muted }}>發布：{a.created_at?new Date(a.created_at).toLocaleDateString("zh-TW"):""}</div>
            <div style={{ display:"flex", gap:8, flexShrink:0 }}>
              <button onClick={()=>startEdit(a)} disabled={editing!==null} style={btn(C.accentBg,C.accent,{padding:"5px 12px",opacity:editing!==null?.5:1})}>✏️ 編輯</button>
              <button onClick={()=>del(a.id)} disabled={editing!==null} style={btn(C.redBg,C.red,{padding:"5px 12px",opacity:editing!==null?.5:1})}>刪除</button>
            </div>
          </div>
          <div style={{ padding:"12px 16px", background:C.bgDeep }}>
            <pre style={{ fontSize:12, color:C.textMid, lineHeight:1.8, whiteSpace:"pre-wrap", fontFamily:"inherit", margin:0 }}>{a.content}</pre>
          </div>
        </div>
      ))}

      {toast && <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", background:C.text, color:"#fff", padding:"11px 22px", borderRadius:99, fontSize:13, zIndex:200, boxShadow:C.shadow }}>{toast}</div>}
    </div>
  );
}
