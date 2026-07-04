import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { C } from "../../theme";
import { uploadImage } from "../adminUtils";
import { isImgSrc } from "../../utils";
import { Modal } from "../ui";

const inp = { width:"100%", padding:"10px 12px", border:`1.5px solid ${C.border}`, borderRadius:10, fontSize:14, boxSizing:"border-box", background:"#fff", color:C.text };
const lab = { fontSize:11, color:C.textMid, display:"block", marginBottom:5 };
const btn = (bg,col,extra={}) => ({ border:"none", background:bg, color:col, borderRadius:10, padding:"8px 16px", fontSize:13, cursor:"pointer", ...extra });

// ─── 商品編輯彈窗 ──────────────────────────────────────────────
function ProductEditor({ product, cats, globalRate, onClose, onSaved }){
  const [form, setForm] = useState(() => ({
    name: product.name || "", category_id: product.category_id || "", type: product.type || "proxy",
    status: product.status || "off", image: product.image || "", payment_type: product.payment_type || "full",
    deadline: product.deadline || "", expected_arrival: product.expected_arrival || "", rate: product.rate ?? globalRate,
  }));
  const [variants, setVariants] = useState(() => (product.variants || []).map(v => ({ ...v })));
  const [newVar, setNewVar] = useState({ spec:"", price:"", costMode:"twd", cost:"", jpy_price:"" });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const isStock = form.type === "stock";
  const set = (k,v) => setForm(f => ({ ...f, [k]: v }));
  const setVar = (id, patch) => setVariants(vs => vs.map(v => v.id===id ? { ...v, ...patch } : v));
  const delVar = (id) => setVariants(vs => vs.filter(v => v.id !== id));
  // 成本自動 = 日幣 × 匯率（改日幣/匯率時重算；直接改成本＝手動覆寫）
  const onJpy  = (v,val) => setVar(v.id, { jpy_price: val, cost: Math.round((Number(val)||0)*(Number(v.rate ?? form.rate)||0)) });
  const onRate = (v,val) => setVar(v.id, { rate: val, cost: Math.round((Number(v.jpy_price)||0)*(Number(val)||0)) });

  const handleUpload = async (file) => {
    if (!file) return;
    if (file.size > 2*1024*1024) { setErr("圖片請小於 2MB"); return; }
    setUploading(true); setErr("");
    try { const url = await uploadImage(file); set("image", url); }
    catch (e) { setErr("上傳失敗：" + (e.message||e)); }
    finally { setUploading(false); }
  };

  const addVariant = () => {
    const cost = newVar.costMode==="jpy" ? Math.round((Number(newVar.jpy_price)||0)*(Number(form.rate)||0)) : (Number(newVar.cost)||0);
    setVariants(vs => [...vs, {
      id:`new_${Date.now()}_${vs.length}`, spec:newVar.spec, price:Number(newVar.price)||0,
      jpy_price: newVar.costMode==="jpy" ? (Number(newVar.jpy_price)||0) : 0, rate: form.rate,
      cost, deposit_amount:0, stock: isStock ? 0 : null, status:"on",
    }]);
    setNewVar({ spec:"", price:"", costMode:"twd", cost:"", jpy_price:"" });
  };

  const save = async () => {
    if (!form.name.trim()) { setErr("請填商品名稱"); return; }
    setSaving(true); setErr("");
    try {
      const { error:e1 } = await supabase.from("products").update({
        name:form.name, category_id:form.category_id||null, type:form.type, status:form.status, image:form.image,
        payment_type: isStock ? "full" : form.payment_type, deadline:form.deadline||null, expected_arrival:form.expected_arrival||null,
        rate: Number(form.rate)||null, updated_at:new Date().toISOString(),
      }).eq("id", product.id);
      if (e1) throw e1;
      // 刪掉被移除的規格
      const keep = variants.filter(v=>!String(v.id).startsWith("new_")).map(v=>v.id);
      for (const rv of (product.variants||[]).filter(ov=>!keep.includes(ov.id))) {
        const { error } = await supabase.from("product_variants").delete().eq("id", rv.id);
        if (error) throw new Error(`規格「${rv.spec||"標準"}」刪除失敗（可能已被下單）`);
      }
      // 新增/更新規格
      for (const v of variants) {
        const stock = isStock ? ((v.stock===""||v.stock==null)?0:Number(v.stock)) : null;
        const payload = {
          product_id:product.id, spec:v.spec||"", price:Number(v.price)||0, jpy_price:Number(v.jpy_price)||0,
          rate:(v.rate===""||v.rate==null)?null:Number(v.rate), cost:Number(v.cost)||0, deposit_amount:Number(v.deposit_amount)||0,
          stock, status:(stock!=null&&stock<=0)?"sold_out":"on", updated_at:new Date().toISOString(),
        };
        const { error } = String(v.id).startsWith("new_")
          ? await supabase.from("product_variants").insert([payload])
          : await supabase.from("product_variants").update(payload).eq("id", v.id);
        if (error) throw error;
      }
      onSaved();
    } catch (e) { setErr(e.message || String(e)); setSaving(false); }
  };

  const sec = { borderTop:`1px solid ${C.borderLight}`, margin:"18px 0 0", paddingTop:18 };
  const h = { fontSize:14, fontWeight:700, marginBottom:12, color:C.text };

  return (
    <Modal onClose={onClose} maxWidth={520}>
      {/* 標題 */}
      <div style={{display:"flex",alignItems:"center",marginBottom:18}}>
        <h2 style={{fontSize:18,fontWeight:700,margin:0}}>編輯商品</h2>
        <button onClick={onClose} style={{marginLeft:"auto",width:32,height:32,borderRadius:"50%",border:"none",background:C.bgDeep,color:C.muted,fontSize:16,cursor:"pointer"}}>✕</button>
      </div>

      {/* 名稱 + 分類 + 類型 + 狀態 */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div style={{gridColumn:"1 / -1"}}><label style={lab}>商品名稱 *</label><input style={inp} value={form.name} onChange={e=>set("name",e.target.value)}/></div>
        <div><label style={lab}>分類</label>
          <select style={inp} value={form.category_id||""} onChange={e=>set("category_id",e.target.value||null)}>
            <option value="">未分類</option>{cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div><label style={lab}>類型</label>
          <select style={inp} value={form.type} onChange={e=>set("type",e.target.value)}>
            <option value="proxy">代購</option><option value="stock">現貨</option>
          </select>
        </div>
        <div><label style={lab}>上架狀態</label>
          <select style={inp} value={form.status} onChange={e=>set("status",e.target.value)}>
            <option value="on">上架中</option><option value="off">下架</option>
          </select>
        </div>
        <div><label style={lab}>💱 匯率 ¥1 = NT$</label><input style={inp} type="number" value={form.rate} onChange={e=>set("rate",e.target.value)}/></div>
      </div>
      <div style={{fontSize:11,color:C.faint,marginTop:6}}>影響本商品所有款式的成本計算（成本＝日幣價格 × 匯率，可手動覆寫）</div>

      {/* 代購：時間設定 + 付款方式 */}
      {!isStock && (<>
        <div style={sec}>
          <div style={h}>時間設定（選填）</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><label style={lab}>⏰ 結單日期</label><input style={inp} type="date" value={form.deadline||""} onChange={e=>set("deadline",e.target.value)}/><div style={{fontSize:10,color:C.faint,marginTop:3}}>客人下單截止日</div></div>
            <div><label style={lab}>📦 預計到貨</label><input style={inp} type="date" value={form.expected_arrival||""} onChange={e=>set("expected_arrival",e.target.value)}/><div style={{fontSize:10,color:C.faint,marginTop:3}}>顯示給客人參考</div></div>
          </div>
        </div>
        <div style={sec}>
          <div style={h}>💰 付款方式</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[{v:"full",t:"付全款",d:"客人下單時付清全額"},{v:"deposit",t:"先付訂金",d:"客人先付訂金，尾款到台後在賣貨便付"},{v:"cod",t:"貨到付款",d:"客人不需先付，到貨時付款"}].map(o=>{
              const on=form.payment_type===o.v;
              return (
                <label key={o.v} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",border:`1.5px solid ${on?C.accent:C.border}`,borderRadius:12,cursor:"pointer",background:on?C.accentBg:"#fff"}}>
                  <input type="radio" checked={on} onChange={()=>set("payment_type",o.v)} style={{accentColor:C.accent}}/>
                  <div><div style={{fontSize:14,fontWeight:on?600:500,color:C.text}}>{o.t}</div><div style={{fontSize:11,color:C.muted}}>{o.d}</div></div>
                </label>
              );
            })}
          </div>
          {form.payment_type==="deposit" && <div style={{fontSize:11,color:C.muted,marginTop:8,padding:"8px 10px",background:C.bgDeep,borderRadius:8}}>💡 各款式訂金請至下方「款式設定」個別填寫</div>}
        </div>
      </>)}

      {/* 商品圖片 */}
      <div style={sec}>
        <div style={h}>商品圖片</div>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <label style={{flex:1,border:`2px dashed ${C.border}`,borderRadius:12,padding:"18px",textAlign:"center",cursor:uploading?"wait":"pointer",background:C.bgDeep}}>
            <div style={{fontSize:22}}>{uploading?"⏳":"📷"}</div>
            <div style={{fontSize:12,color:C.muted,marginTop:4}}>{uploading?"上傳中…":"點擊選擇圖片"}</div>
            <div style={{fontSize:10,color:C.faint}}>JPG / PNG，最大 2MB</div>
            <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];e.target.value="";handleUpload(f);}}/>
          </label>
          <div style={{width:80,height:80,borderRadius:12,background:C.bgDeep,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0,fontSize:34}}>
            {isImgSrc(form.image)?<img src={form.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:(form.image||"🛒")}
          </div>
        </div>
        <input style={{...inp,marginTop:8}} value={form.image} onChange={e=>set("image",e.target.value)} placeholder="或填 emoji / 圖片網址"/>
      </div>

      {/* 款式設定 */}
      <div style={sec}>
        <div style={h}>款式設定</div>
        <div style={{fontSize:11,color:C.muted,marginBottom:10,lineHeight:1.6}}>例如：顏色(紅色、藍色)、尺寸(S/M/L)，客人下單時可從中選擇。<br/>成本預設＝日幣 × 匯率（目前 ¥1＝NT${form.rate||0}），也可直接改成本欄位。</div>

        {variants.map(v => {
          const remain = Math.max(0,(Number(v.price)||0)-(Number(v.deposit_amount)||0));
          return (
            <div key={v.id} style={{border:`1px solid ${C.border}`,borderRadius:12,padding:14,marginBottom:12,background:C.surface}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <input style={{...inp,fontWeight:600}} value={v.spec||""} onChange={e=>setVar(v.id,{spec:e.target.value})} placeholder="款式名稱（空＝無款式）"/>
                <button onClick={()=>delVar(v.id)} style={{width:30,height:30,borderRadius:8,border:"none",background:C.redBg,color:C.red,fontSize:15,cursor:"pointer",flexShrink:0}}>✕</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><label style={lab}>售價 NT$</label><input style={inp} type="number" value={v.price} onChange={e=>setVar(v.id,{price:e.target.value})}/></div>
                {isStock
                  ? <div><label style={lab}>庫存</label><input style={inp} type="number" value={v.stock==null?"":v.stock} onChange={e=>setVar(v.id,{stock:e.target.value})} placeholder="0"/></div>
                  : <div><label style={lab}>💰 訂金 NT$</label><input style={inp} type="number" value={v.deposit_amount==null?"":v.deposit_amount} onChange={e=>setVar(v.id,{deposit_amount:e.target.value})} placeholder="0"/></div>}
                <div><label style={lab}>日幣價格 ¥</label><input style={inp} type="number" value={v.jpy_price==null?"":v.jpy_price} onChange={e=>onJpy(v,e.target.value)} placeholder="0"/></div>
                <div><label style={lab}>匯率 ¥1＝NT$</label><input style={inp} type="number" value={v.rate==null?"":v.rate} onChange={e=>onRate(v,e.target.value)} placeholder={String(form.rate||0)}/></div>
                <div style={{gridColumn:"1 / -1"}}><label style={lab}>成本 NT$（可手動覆寫）</label><input style={{...inp,color:C.accent,fontWeight:600}} type="number" value={v.cost==null?"":v.cost} onChange={e=>setVar(v.id,{cost:e.target.value})}/></div>
              </div>
              {!isStock && Number(v.deposit_amount)>0 && <div style={{fontSize:11,color:C.muted,marginTop:6}}>剩餘 NT${remain} 於取貨時付</div>}
            </div>
          );
        })}

        {/* 新增款式 */}
        <div style={{border:`1.5px dashed ${C.border}`,borderRadius:12,padding:14}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>＋ 新增款式</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div><label style={lab}>款式名稱</label><input style={inp} value={newVar.spec} onChange={e=>setNewVar({...newVar,spec:e.target.value})} placeholder="紅色 / M號 / 草莓"/></div>
            <div><label style={lab}>售價 NT$</label><input style={inp} type="number" value={newVar.price} onChange={e=>setNewVar({...newVar,price:e.target.value})} placeholder="0"/></div>
            <div><label style={lab}>成本填寫方式</label>
              <div style={{display:"flex",gap:8}}>
                {[{v:"twd",t:"直接填台幣"},{v:"jpy",t:"日幣 × 匯率"}].map(o=>(
                  <button key={o.v} onClick={()=>setNewVar({...newVar,costMode:o.v})} style={{flex:1,...btn(newVar.costMode===o.v?C.accent:"#fff",newVar.costMode===o.v?"#fff":C.textMid,{border:`1.5px solid ${newVar.costMode===o.v?C.accent:C.border}`})}}>{o.t}</button>
                ))}
              </div>
            </div>
            {newVar.costMode==="jpy"
              ? <div><label style={lab}>日幣價格 ¥（× {form.rate||0}）</label><input style={inp} type="number" value={newVar.jpy_price} onChange={e=>setNewVar({...newVar,jpy_price:e.target.value})} placeholder="0"/></div>
              : <div><label style={lab}>成本 NT$</label><input style={inp} type="number" value={newVar.cost} onChange={e=>setNewVar({...newVar,cost:e.target.value})} placeholder="0"/></div>}
            <button onClick={addVariant} style={btn(C.accentBg,C.accent,{fontWeight:600,padding:"11px"})}>新增此款式</button>
          </div>
        </div>
      </div>

      {err && <div style={{fontSize:12,color:C.red,background:C.redBg,padding:"8px 12px",borderRadius:8,marginTop:14}}>{err}</div>}
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:18}}>
        <button onClick={onClose} style={btn("#fff",C.textMid,{border:`1.5px solid ${C.border}`,padding:"10px 22px"})}>取消</button>
        <button onClick={save} disabled={saving} style={btn(C.accent,"#fff",{padding:"10px 26px",fontWeight:600,opacity:saving?.6:1,cursor:saving?"not-allowed":"pointer"})}>{saving?"儲存中…":"儲存"}</button>
      </div>
    </Modal>
  );
}

// ─── 商品管理（列表 + 編輯彈窗）────────────────────────────────
export function ProductsPage(){
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [globalRate, setGlobalRate] = useState(0.23);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: prods }, { data: categories }, { data: setting }] = await Promise.all([
      supabase.from("products").select("*, variants:product_variants(*)").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("sort_order", { ascending: true }),
      supabase.from("settings").select("value").eq("key", "jpy_rate").maybeSingle(),
    ]);
    setItems((prods || []).map(it => ({ ...it, variants: (it.variants || []).slice().sort((a,b)=>(a.created_at||"").localeCompare(b.created_at||"")) })));
    setCats(categories || []);
    if (setting?.value) setGlobalRate(Number(setting.value) || 0.23);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const flash = m => { setMsg(m); setTimeout(() => setMsg(""), 1500); };

  const addItem = async () => {
    const { data, error } = await supabase.from("products").insert([{ type:"proxy", name:"新商品", image:"🛒", status:"off", rate:globalRate }]).select().single();
    if (error) { alert(error.message); return; }
    await supabase.from("product_variants").insert([{ product_id:data.id, spec:"", price:0, stock:null }]);
    const { data:full } = await supabase.from("products").select("*, variants:product_variants(*)").eq("id", data.id).single();
    setEditing(full);
  };

  const delItem = async (id) => {
    if (!window.confirm("刪除此商品（含所有規格）？")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { alert("刪除失敗：此商品可能已有訂單引用，建議維持下架。\n" + error.message); return; }
    load();
  };

  const th = { textAlign:"left", padding:"6px 8px", fontSize:11, color:C.muted, fontWeight:600 };
  const filtered = items.filter(it =>
    (!search.trim() || (it.name||"").includes(search)) &&
    (statusFilter==="all" || it.status===statusFilter));

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, flexWrap:"wrap" }}>
        <h2 style={{ fontSize:18, fontWeight:700, margin:0 }}>商品管理</h2>
        {msg && <span style={{ fontSize:13, color:C.green }}>{msg}</span>}
        <div style={{ marginLeft:"auto" }} />
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ padding:"8px 14px", border:`1.5px solid ${C.border}`, borderRadius:99, fontSize:13, background:"#fff" }}>
          <option value="all">全部狀態</option><option value="on">上架中</option><option value="off">下架</option>
        </select>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜尋商品" style={{ padding:"8px 14px", border:`1.5px solid ${C.border}`, borderRadius:99, fontSize:13 }}/>
        <button onClick={addItem} style={{ background:C.accent, color:"#fff", border:"none", borderRadius:99, padding:"8px 18px", fontSize:13, cursor:"pointer" }}>+ 新增商品</button>
      </div>

      {loading ? <div style={{ color:C.muted, padding:20 }}>載入中…</div> :
       filtered.length === 0 ? <div style={{ color:C.faint, padding:40, textAlign:"center", background:C.surface, borderRadius:C.r }}>沒有商品</div> :
       <div style={{ background:C.surface, borderRadius:C.r, boxShadow:C.shadow, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr style={{ borderBottom:`1px solid ${C.border}` }}>
            <th style={th}></th><th style={th}>名稱</th><th style={th}>類型</th><th style={th}>分類</th><th style={th}>款式/售價</th><th style={th}>狀態</th><th style={th}></th>
          </tr></thead>
          <tbody>
            {filtered.map(it => {
              const prices = (it.variants||[]).map(v=>Number(v.price)||0).filter(x=>x>0);
              const priceLabel = prices.length ? (Math.min(...prices)===Math.max(...prices) ? `NT$${Math.min(...prices)}` : `NT$${Math.min(...prices)}~${Math.max(...prices)}`) : "—";
              return (
              <tr key={it.id} style={{ borderBottom:`1px solid ${C.borderLight}` }}>
                <td style={{ padding:"8px" }}><div style={{ width:40,height:40,borderRadius:8,background:C.bgDeep,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",fontSize:20 }}>{isImgSrc(it.image)?<img src={it.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:(it.image||"🛒")}</div></td>
                <td style={{ padding:"8px", fontSize:13, fontWeight:500 }}>{it.name}</td>
                <td style={{ padding:"8px", fontSize:12, color:it.type==="stock"?C.green:C.muted }}>{it.type==="stock"?"現貨":"代購"}</td>
                <td style={{ padding:"8px", fontSize:12, color:C.muted }}>{cats.find(c=>c.id===it.category_id)?.name || "—"}</td>
                <td style={{ padding:"8px", fontSize:12, color:C.textMid }}>{(it.variants||[]).length} 款 · {priceLabel}</td>
                <td style={{ padding:"8px", fontSize:12 }}><span style={{ color:it.status==="on"?C.green:C.muted }}>{it.status==="on"?"上架中":"下架"}</span></td>
                <td style={{ padding:"8px", whiteSpace:"nowrap" }}>
                  <button onClick={()=>setEditing(it)} style={{ ...btn(C.accent,"#fff"), marginRight:6 }}>編輯</button>
                  {it.status==="off" && <button onClick={()=>delItem(it.id)} style={btn(C.redBg,C.red)}>刪除</button>}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
       </div>
      }

      {editing && <ProductEditor product={editing} cats={cats} globalRate={globalRate} onClose={()=>setEditing(null)} onSaved={()=>{ setEditing(null); flash("已儲存 ✅"); load(); }}/>}
    </div>
  );
}
