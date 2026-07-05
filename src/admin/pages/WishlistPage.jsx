import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { C } from "../../theme";
import { isImgSrc } from "../../utils";

export function WishlistPage(){
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [toast, setToast] = useState("");
  const flash = m => { setToast(m); setTimeout(()=>setToast(""), 2400); };

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("wishlist").select("*").order("created_at",{ascending:false});
    setList(data || []); setLoading(false);
  };
  useEffect(()=>{ load(); }, []);

  const setStatus = async (w, status) => {
    const { error } = await supabase.from("wishlist").update({ status }).eq("id", w.id);
    if (error) { flash("更新失敗"); return; }
    if (status==="found") { setEditId(w.id); setPrice(w.price?String(w.price):""); setNote(w.found_note||""); }
    load();
  };
  const saveQuote = async (id) => {
    const { error } = await supabase.from("wishlist").update({ price:Math.max(0,Number(price)||0), found_note:note.trim().slice(0,200) }).eq("id", id);
    if (error) { flash("儲存失敗"); return; }
    setEditId(null); setPrice(""); setNote(""); flash("報價已回填，客人可加購 ✅"); load();
  };
  const del = async (w) => {
    if (!window.confirm(`刪除 ${w.customer_name||"客人"} 的許願「${w.name}」？`)) return;
    const { error } = await supabase.from("wishlist").delete().eq("id", w.id);
    if (error) { flash("刪除失敗"); return; }
    flash("已刪除許願"); load();
  };

  const inp = { width:"100%", background:C.surface, border:`1.5px solid ${C.border}`, borderRadius:8, padding:"8px 12px", fontSize:13, color:C.text, boxSizing:"border-box" };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12, maxWidth:640 }}>
      <div style={{ fontWeight:700, fontSize:16, color:C.accentDark }}>許願清單（{list.length}）</div>

      {loading ? <div style={{ color:C.muted, padding:20 }}>載入中…</div> :
       !list.length ? <div style={{ textAlign:"center", padding:"36px 0", background:C.surface, borderRadius:C.r, color:C.muted }}><div style={{ fontSize:40, marginBottom:8 }}>⭐</div>還沒有客人許願</div> :
       list.map(w=>{
        const isFound = w.status==="found";
        const isEdit = editId===w.id;
        return (
        <div key={w.id} style={{ background:C.surface, borderRadius:C.r, boxShadow:C.shadow, padding:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:isFound?12:0 }}>
            <div style={{ flex:1, minWidth:0, marginRight:12 }}>
              <div style={{ fontWeight:700 }}>{w.name}</div>
              <div style={{ fontSize:13, color:C.muted }}>客人：{w.customer_name||"匿名"}</div>
              {w.note && <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>✏️ {w.note}</div>}
              {w.link && <a href={w.link} target="_blank" rel="noreferrer" style={{ fontSize:11, color:C.accent, display:"block", marginTop:4, wordBreak:"break-all" }}>🔗 {w.link}</a>}
              {isImgSrc(w.img_url) && <img src={w.img_url} alt="參考圖" onError={e=>e.target.style.display="none"} style={{ width:"100%", maxHeight:140, objectFit:"cover", borderRadius:8, marginTop:8, border:`1px solid ${C.border}` }}/>}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
              <select value={w.status} onChange={e=>setStatus(w, e.target.value)} style={{ background:C.bgDeep, border:`1.5px solid ${C.border}`, borderRadius:8, padding:"4px 8px", fontSize:12, cursor:"pointer" }}>
                <option value="searching">⭐ 許願中</option>
                <option value="found">✅ 找到了</option>
              </select>
              <button onClick={()=>del(w)} title="刪除" style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, padding:"4px 8px", fontSize:14, cursor:"pointer", color:C.red, lineHeight:1 }}>🗑</button>
            </div>
          </div>

          {isFound && (
            <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:12 }}>
              {isEdit ? (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <div style={{ fontSize:12, color:C.muted, fontWeight:500 }}>回填報價給客人</div>
                  <div><div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>報價 NT$</div><input type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder="0" style={inp}/></div>
                  <div><div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>備註（可選）</div><input value={note} onChange={e=>setNote(e.target.value)} placeholder="例：京都限定款，數量有限" style={inp}/></div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>saveQuote(w.id)} style={{ flex:1, background:C.accent, color:"#fff", border:"none", borderRadius:8, padding:"9px", fontSize:13, fontWeight:600, cursor:"pointer" }}>儲存報價</button>
                    <button onClick={()=>setEditId(null)} style={{ background:C.bgDeep, color:C.muted, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 16px", fontSize:13, cursor:"pointer" }}>取消</button>
                  </div>
                </div>
              ) : (
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    {w.price>0 ? <><div style={{ fontSize:13, color:C.muted }}>已回填報價</div><div style={{ fontSize:18, fontWeight:700, color:C.accent }}>NT$ {Number(w.price).toLocaleString()}</div></> : <div style={{ fontSize:13, color:C.muted }}>尚未回填報價</div>}
                    {w.found_note && <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{w.found_note}</div>}
                  </div>
                  <button onClick={()=>{ setEditId(w.id); setPrice(w.price?String(w.price):""); setNote(w.found_note||""); }} style={{ background:C.bgDeep, color:C.textMid, border:`1px solid ${C.border}`, borderRadius:8, padding:"7px 14px", fontSize:12, cursor:"pointer" }}>{w.price>0?"修改報價":"填入報價"}</button>
                </div>
              )}
            </div>
          )}
        </div>
        );
      })}

      {toast && <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", background:C.text, color:"#fff", padding:"11px 22px", borderRadius:99, fontSize:13, zIndex:200, boxShadow:C.shadow }}>{toast}</div>}
    </div>
  );
}
