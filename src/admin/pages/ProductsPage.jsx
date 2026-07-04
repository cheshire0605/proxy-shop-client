import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { C } from "../../theme";
import { uploadImage } from "../adminUtils";
import { isImgSrc } from "../../utils";

// 商品管理（統一：代購 + 現貨；type 區分、每規格 price/stock）
export function ProductsPage(){
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [uploadingId, setUploadingId] = useState(null);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: prods }, { data: categories }] = await Promise.all([
      supabase.from("products").select("*, variants:product_variants(*)").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("sort_order", { ascending: true }),
    ]);
    setItems((prods || []).map(it => ({ ...it, _saved: it.status, variants: (it.variants || []).slice().sort((a,b)=>(a.created_at||"").localeCompare(b.created_at||"")) })));
    setCats(categories || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const flash = m => { setMsg(m); setTimeout(() => setMsg(""), 1500); };
  const setItem = (id, patch) => setItems(items.map(it => it.id === id ? { ...it, ...patch } : it));
  const setVar  = (itemId, vid, patch) => setItems(items.map(it => it.id !== itemId ? it : { ...it, variants: it.variants.map(v => v.id === vid ? { ...v, ...patch } : v) }));

  const addItem = async () => {
    const { data, error } = await supabase.from("products").insert([{ type: "proxy", name: "新商品", image: "🛒", status: "on" }]).select().single();
    if (error) { alert(error.message); return; }
    await supabase.from("product_variants").insert([{ product_id: data.id, spec: "", price: 0, stock: null }]);
    load();
  };
  const delItem = async id => {
    if (!window.confirm("刪除此商品（含所有規格）？")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { alert("刪除失敗：此商品可能已有訂單引用，建議維持下架。\n" + error.message); return; }
    load();
  };
  const saveItem = async it => {
    const { error } = await supabase.from("products").update({ name: it.name, image: it.image, type: it.type, category_id: it.category_id || null, status: it.status, payment_type: it.type === "stock" ? "full" : (it.payment_type || "full"), deadline: it.deadline || null, expected_arrival: it.expected_arrival || null, updated_at: new Date().toISOString() }).eq("id", it.id);
    if (error) alert(error.message); else { flash("已儲存 ✅"); setItem(it.id, { _saved: it.status }); }
  };
  // 上傳圖片：傳到 product-images，成功即寫回 DB（image 欄），前台以 URL 顯示
  const handleUpload = async (it, file) => {
    if (file.size > 5 * 1024 * 1024) { alert("圖片請小於 5MB"); return; }
    setUploadingId(it.id);
    try {
      const url = await uploadImage(file);
      const { error } = await supabase.from("products").update({ image: url, updated_at: new Date().toISOString() }).eq("id", it.id);
      if (error) throw error;
      setItem(it.id, { image: url });
      flash("圖片已更新 ✅");
    } catch (e) { alert("上傳失敗：" + (e.message || e)); }
    finally { setUploadingId(null); }
  };

  const addVar = async (itemId, isStock) => { await supabase.from("product_variants").insert([{ product_id: itemId, spec: "", price: 0, stock: isStock ? 0 : null }]); load(); };
  const delVar = async vid => {
    if (!window.confirm("刪除此規格？")) return;
    const { error } = await supabase.from("product_variants").delete().eq("id", vid);
    if (error) { alert("刪除失敗：此規格可能已有訂單引用，建議維持下架。\n" + error.message); return; }
    load();
  };
  const saveVar = async v => {
    const stock = (v.stock === "" || v.stock == null) ? null : Number(v.stock);
    const status = stock != null && stock <= 0 ? "sold_out" : "on";
    const { error } = await supabase.from("product_variants").update({ spec: v.spec || "", price: Number(v.price) || 0, stock, deposit_amount: Number(v.deposit_amount) || 0, cost: Number(v.cost) || 0, status, updated_at: new Date().toISOString() }).eq("id", v.id);
    if (error) alert(error.message); else { flash("已儲存 ✅"); setVar(v.product_id, v.id, { status }); }
  };

  const inp = { padding: "7px 10px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, boxSizing: "border-box", background: "#fff" };
  const th = { textAlign: "left", padding: "6px 8px", fontSize: 11, color: C.muted, fontWeight: 600 };
  const td = { padding: "6px 8px", fontSize: 13, borderTop: `1px solid ${C.borderLight}` };
  const btn = (bg, col) => ({ border: "none", background: bg, color: col, borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" });

  const filtered = items.filter(it =>
    (!search.trim() || (it.name || "").includes(search)) &&
    (statusFilter === "all" || it._saved === statusFilter));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>商品管理</h2>
        {msg && <span style={{ fontSize: 13, color: C.green }}>{msg}</span>}
        <div style={{ marginLeft: "auto" }} />
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ padding:"8px 14px", border:`1.5px solid ${C.border}`, borderRadius:99, fontSize:13, background:"#fff" }}>
          <option value="all">全部狀態</option>
          <option value="on">上架中</option>
          <option value="off">下架</option>
        </select>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜尋商品" style={{ padding:"8px 14px", border:`1.5px solid ${C.border}`, borderRadius:99, fontSize:13 }}/>
        <button onClick={load} style={{ border:`1px solid ${C.border}`, background:C.surface, borderRadius:99, padding:"6px 14px", fontSize:12, cursor:"pointer", color:C.textMid }}>重新整理</button>
        <button onClick={addItem} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 99, padding: "8px 18px", fontSize: 13, cursor: "pointer" }}>+ 新增商品</button>
      </div>

      {loading ? <div style={{ color: C.muted, padding: 20 }}>載入中…</div> :
       filtered.length === 0 ? <div style={{ color: C.faint, padding: 40, textAlign: "center", background: C.surface, borderRadius: C.r }}>沒有商品</div> :
       <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {filtered.map(it => {
          const isStock = it.type === "stock";
          return (
          <div key={it.id} style={{ background: C.surface, borderRadius: C.r, boxShadow: C.shadow, padding: 18 }}>
            {/* 商品標題列 */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              {isImgSrc(it.image) && <img src={it.image} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 8, border: `1px solid ${C.border}` }} />}
              <input value={it.image || ""} onChange={e => setItem(it.id, { image: e.target.value })} style={{ ...inp, width: 56, textAlign: "center" }} title="emoji 或圖片網址" />
              <label style={{ ...btn(C.bgDeep, C.textMid), cursor: uploadingId === it.id ? "wait" : "pointer", whiteSpace: "nowrap" }}>
                {uploadingId === it.id ? "上傳中…" : "📷 上傳"}
                <input type="file" accept="image/*" disabled={uploadingId === it.id} style={{ display: "none" }}
                  onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) handleUpload(it, f); }} />
              </label>
              <input value={it.name} onChange={e => setItem(it.id, { name: e.target.value })} style={{ ...inp, flex: "1 1 160px", fontWeight: 600 }} />
              <select value={it.type} onChange={e => setItem(it.id, { type: e.target.value })} style={inp}>
                <option value="proxy">代購</option>
                <option value="stock">現貨</option>
              </select>
              <select value={it.category_id || ""} onChange={e => setItem(it.id, { category_id: e.target.value || null })} style={inp}>
                <option value="">未分類</option>
                {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={it.status} onChange={e => setItem(it.id, { status: e.target.value })} style={inp}>
                <option value="on">上架中</option>
                <option value="off">下架</option>
              </select>
              <button onClick={() => saveItem(it)} style={btn(C.accent, "#fff")}>儲存</button>
              {it._saved === "off" && <button onClick={() => delItem(it.id)} style={btn(C.redBg, C.red)}>刪除</button>}
            </div>
            {/* 代購專屬：付款方式 + 結單/到貨日期（現貨一律全額、無代購日期） */}
            {!isStock && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap", fontSize: 12, color: C.muted }}>
                <span>付款</span>
                <select value={it.payment_type || "full"} onChange={e => setItem(it.id, { payment_type: e.target.value })} style={inp}>
                  <option value="full">全額</option>
                  <option value="deposit">訂金</option>
                  <option value="cod">貨到付款</option>
                </select>
                <span>結單日</span>
                <input type="date" value={it.deadline || ""} onChange={e => setItem(it.id, { deadline: e.target.value })} style={inp} />
                <span>到貨日</span>
                <input type="date" value={it.expected_arrival || ""} onChange={e => setItem(it.id, { expected_arrival: e.target.value })} style={inp} />
              </div>
            )}
            {/* 規格 */}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>規格（空=無規格）</th><th style={th}>售價</th><th style={th}>庫存（空=代購無限）</th><th style={th}>訂金</th><th style={th}>成本</th><th style={th}>狀態</th><th style={th}></th></tr></thead>
              <tbody>
                {it.variants.map(v => {
                  const s = (v.stock === "" || v.stock == null) ? null : Number(v.stock);
                  return (
                  <tr key={v.id}>
                    <td style={td}><input value={v.spec || ""} onChange={e => setVar(it.id, v.id, { spec: e.target.value })} style={{ ...inp, width: "100%" }} placeholder="紅色…" /></td>
                    <td style={td}><input type="number" value={v.price} onChange={e => setVar(it.id, v.id, { price: e.target.value })} style={{ ...inp, width: 90 }} /></td>
                    <td style={td}><input type="number" value={v.stock == null ? "" : v.stock} onChange={e => setVar(it.id, v.id, { stock: e.target.value })} style={{ ...inp, width: 90 }} placeholder="無限" /></td>
                    <td style={td}><input type="number" value={v.deposit_amount == null ? "" : v.deposit_amount} onChange={e => setVar(it.id, v.id, { deposit_amount: e.target.value })} style={{ ...inp, width: 76 }} placeholder="0" title="訂金（付款方式=訂金時用）" /></td>
                    <td style={td}><input type="number" value={v.cost == null ? "" : v.cost} onChange={e => setVar(it.id, v.id, { cost: e.target.value })} style={{ ...inp, width: 76 }} placeholder="0" title="成本（算利潤用）" /></td>
                    <td style={{ ...td, color: s == null ? C.muted : (s <= 0 ? C.red : C.green) }}>{s == null ? "代購" : (s <= 0 ? "售完" : "販售中")}</td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>
                      <button onClick={() => saveVar(v)} style={{ ...btn(C.accentBg, C.accent), marginRight: 6 }}>儲存</button>
                      <button onClick={() => delVar(v.id)} style={btn(C.redBg, C.red)}>刪除</button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            <button onClick={() => addVar(it.id, isStock)} style={{ ...btn(C.bgDeep, C.textMid), marginTop: 10 }}>+ 新增規格</button>
          </div>
          );
        })}
       </div>
      }
    </div>
  );
}
