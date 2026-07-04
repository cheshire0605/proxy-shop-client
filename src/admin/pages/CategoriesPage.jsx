import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { C } from "../../theme";
import { th, td, inp } from "../ui";

// 分類管理（新增/改名/排序/刪除）
export function CategoriesPage(){
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("categories").select("*").order("sort_order", { ascending: true });
    setCats(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const flash = m => { setMsg(m); setTimeout(() => setMsg(""), 1500); };
  const setCat = (id, patch) => setCats(cats.map(c => c.id === id ? { ...c, ...patch } : c));

  const add = async () => {
    const { error } = await supabase.from("categories").insert([{ name: "新分類", sort_order: (cats.length + 1) * 10 }]);
    if (error) alert(error.message); else load();
  };
  const save = async c => {
    const { error } = await supabase.from("categories").update({ name: c.name, sort_order: Number(c.sort_order) || 0 }).eq("id", c.id);
    if (error) alert(error.message); else { flash("已儲存 ✅"); load(); }
  };
  const del = async id => { if (!window.confirm("刪除此分類？（原本屬於它的商品會變成未分類）")) return; await supabase.from("categories").delete().eq("id", id); load(); };

  const btn = (bg, col) => ({ border: "none", background: bg, color: col, borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>分類管理</h2>
        {msg && <span style={{ fontSize: 13, color: C.green }}>{msg}</span>}
        <div style={{ marginLeft: "auto" }} />
        <button onClick={add} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 99, padding: "8px 18px", fontSize: 13, cursor: "pointer" }}>+ 新增分類</button>
      </div>

      {loading ? <div style={{ color: C.muted, padding: 20 }}>載入中…</div> :
       cats.length === 0 ? <div style={{ color: C.faint, padding: 40, textAlign: "center", background: C.surface, borderRadius: C.r }}>還沒有分類</div> :
       <div style={{ overflowX: "auto", background: C.surface, borderRadius: C.r, boxShadow: C.shadow }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={th}>分類名稱</th><th style={th}>排序</th><th style={th}></th></tr></thead>
          <tbody>
            {cats.map(c => (
              <tr key={c.id}>
                <td style={td}><input value={c.name} onChange={e => setCat(c.id, { name: e.target.value })} style={{ ...inp, width: "100%" }} /></td>
                <td style={td}><input type="number" value={c.sort_order} onChange={e => setCat(c.id, { sort_order: e.target.value })} style={{ ...inp, width: 80 }} /></td>
                <td style={{ ...td, whiteSpace: "nowrap" }}>
                  <button onClick={() => save(c)} style={{ ...btn(C.accent, "#fff"), marginRight: 6 }}>儲存</button>
                  <button onClick={() => del(c.id)} style={btn(C.redBg, C.red)}>刪除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
       </div>
      }
    </div>
  );
}
