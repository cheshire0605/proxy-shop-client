import { useState } from "react";
import { C } from "../theme";
import { Card, Btn } from "../components/ui";
import { fmtMoney, secureUid } from "../utils";
import { supabase } from "../supabase";

// ─── 許願 Tab ─────────────────────────────────────────────────────
export function WishlistTab({wishes,onAddWish,onDeleteWish,onAddToCart,setTab}){
  const [name,setName]=useState("");
  const [note,setNote]=useState("");
  const [imgUrl,setImgUrl]=useState("");
  const [imgFile,setImgFile]=useState(null);
  const [imgPreview,setImgPreview]=useState("");
  const [link,setLink]=useState("");
  const [submitting,setSubmitting]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [showForm,setShowForm]=useState(false);

  const handleFileChange=async(e)=>{
    const file=e.target.files?.[0];
    if(!file)return;
    if(file.size>5*1024*1024){alert("圖片大小請勿超過 5MB");return;}
    setImgFile(file);setImgUrl("");
    const reader=new FileReader();
    reader.onload=ev=>setImgPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const uploadImage=async()=>{
    if(!imgFile)return imgUrl||"";
    setUploading(true);
    const ext=imgFile.name.split(".").pop();
    const path=`${secureUid()}.${ext}`;
    const{error}=await supabase.storage.from("wishlist-images").upload(path,imgFile,{contentType:imgFile.type});
    setUploading(false);
    if(error){alert("圖片上傳失敗");return "";}
    const{data}=supabase.storage.from("wishlist-images").getPublicUrl(path);
    return data.publicUrl||"";
  };

  const submit=async()=>{
    if(!name.trim())return;
    setSubmitting(true);
    const uploadedUrl=await uploadImage();
    await onAddWish(name,note,uploadedUrl||imgUrl,link);
    setName("");setNote("");setImgUrl("");setImgFile(null);setImgPreview("");setLink("");
    setShowForm(false);setSubmitting(false);
  };

  const inp={width:"100%",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:C.rSm,padding:"11px 14px",fontSize:13,color:C.text,fontFamily:"'Noto Sans TC',sans-serif"};

  return(
    <div style={{padding:"16px 16px 100px",display:"flex",flexDirection:"column",gap:14}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:17,fontWeight:600,color:C.text}}>許願清單</div>
          <div style={{fontSize:12,color:C.muted,marginTop:2,lineHeight:1.6}}>想連線或找的品項，Luna 報價後可直接下單 🌸</div>
        </div>
        <button onClick={()=>setShowForm(v=>!v)} style={{background:showForm?C.bgDeep:C.accent,color:showForm?C.muted:"#fff",border:"none",borderRadius:99,padding:"8px 18px",fontSize:12,cursor:"pointer",fontWeight:500}}>
          {showForm?"取消":"+ 新增"}
        </button>
      </div>

      {/* 新增表單 */}
      {showForm&&(
        <Card style={{padding:"18px"}} className="fadeUp">
          <div style={{fontSize:12,color:C.muted,marginBottom:14}}>可以直接丟商品名稱、圖片、連結</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="想看的商品名稱 *" style={inp}
              onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
            <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="補充描述（可選）" rows={2} style={{...inp,resize:"none"}}
              onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
            <div>
              <div style={{fontSize:11,color:C.muted,marginBottom:6}}>上傳圖片（可選）</div>
              <label style={{display:"block",cursor:"pointer"}}>
                <div style={{border:`1.5px dashed ${imgPreview?C.accent:C.border}`,borderRadius:C.rSm,padding:"14px",textAlign:"center",background:C.bgDeep}}>
                  {imgPreview?<img src={imgPreview} alt="預覽" style={{width:"100%",maxHeight:140,objectFit:"cover",borderRadius:8}}/>
                    :<><div style={{fontSize:20,marginBottom:4}}>📷</div><div style={{fontSize:12,color:C.faint}}>點擊上傳 JPG / PNG（max 5MB）</div></>}
                </div>
                <input type="file" accept="image/*" onChange={handleFileChange} style={{display:"none"}}/>
              </label>
              {imgPreview&&<button onClick={()=>{setImgFile(null);setImgPreview("");}} style={{fontSize:11,color:C.red,background:"none",border:"none",cursor:"pointer",marginTop:4}}>✕ 移除</button>}
            </div>
            {!imgFile&&(
              <input value={imgUrl} onChange={e=>setImgUrl(e.target.value)} placeholder="或貼上圖片網址 https://..." style={inp}
                onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
            )}
            <input value={link} onChange={e=>setLink(e.target.value)} placeholder="商品連結（可選）" style={inp}
              onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
            <Btn full onClick={submit} disabled={submitting||uploading||!name.trim()}>
              {uploading?"上傳中...":submitting?"送出中...":"發起許願"}
            </Btn>
          </div>
        </Card>
      )}

      {/* 許願列表 */}
      {!wishes.length
        ?<Card style={{padding:"40px 20px",textAlign:"center"}}><div style={{fontSize:32,marginBottom:8}}>✨</div><div style={{fontSize:13,color:C.faint}}>還沒有許願商品</div></Card>
        :<div style={{display:"flex",flexDirection:"column",gap:12}}>
          {wishes.map((w,i)=>{
            const isFound=w.status==="found";
            const hasPrice=isFound&&w.price>0;
            return(
              <Card key={w.id} className="fadeUp" style={{animationDelay:`${i*.04}s`,padding:"16px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:isFound?12:0}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:500,color:C.text,marginBottom:3}}>{w.name}</div>
                    {w.note&&<div style={{fontSize:12,color:C.muted}}>{w.note}</div>}
                    {w.link&&<a href={w.link} target="_blank" rel="noreferrer" style={{fontSize:11,color:C.accent,marginTop:4,display:"block",wordBreak:"break-all"}}>🔗 {w.link}</a>}
                    {w.img_url&&<img src={w.img_url} alt="參考" style={{width:"100%",maxHeight:120,objectFit:"cover",borderRadius:10,marginTop:8,border:`1px solid ${C.borderLight}`}} onError={e=>e.target.style.display="none"}/>}
                  </div>
                  <span style={{fontSize:11,border:`1px solid ${isFound?C.green:C.border}`,color:isFound?C.green:C.muted,padding:"3px 10px",borderRadius:99,whiteSpace:"nowrap",flexShrink:0}}>
                    {isFound?"已找到":"許願中"}
                  </span>
                </div>
                {isFound&&(
                  <div style={{background:C.greenBg,borderRadius:C.rSm,padding:"12px 14px",border:`1px solid ${C.green}20`,marginBottom:10}}>
                    {hasPrice&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div style={{fontSize:12,color:C.muted}}>Luna 報價</div><div style={{fontSize:17,fontWeight:700,color:C.green}}>{fmtMoney(w.price)}</div></div>}
                    {w.found_note&&<div style={{fontSize:12,color:C.textMid,marginBottom:10,lineHeight:1.6}}>{w.found_note}</div>}
                    <Btn full sm onClick={()=>{onAddToCart({id:w.id+"_wish",name:w.name,price:hasPrice?w.price:0,image:w.img_url||"",category:"許願商品"});setTab("catalog");}}>加入購物車下單</Btn>
                  </div>
                )}
                <button onClick={()=>{if(window.confirm("確定要刪除這個許願嗎？"))onDeleteWish(w.id);}}
                  style={{fontSize:11,color:C.faint,background:"none",border:`1px solid ${C.borderLight}`,borderRadius:99,padding:"4px 12px",cursor:"pointer"}}>
                  刪除許願
                </button>
              </Card>
            );
          })}
        </div>
      }
    </div>
  );
}
