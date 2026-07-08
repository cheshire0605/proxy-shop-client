import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { C } from "./theme";
import { injectStyles } from "./styles";
import { sanitize, safePrice, safeQty, secureUid, secureOrderNo, parseItemName, orderItemsToLegacy } from "./utils";
import { ensureCustomerSession, signInFakeLine } from "./customerAuth";
import { FAKE_ACCOUNTS } from "./devFakeAccounts";
import { Icon } from "./components/Icon";
import { Toast } from "./components/ui";
import { BottomNav } from "./components/BottomNav";
import { LineLogin } from "./pages/LineLogin";
import { ProfileTab } from "./pages/ProfileTab";
import { CatalogTab } from "./pages/CatalogTab";
import { WishlistTab } from "./pages/WishlistTab";
import { OrdersTab } from "./pages/OrdersTab";
import { ShipmentsTab } from "./pages/ShipmentsTab";

// 本地開發模式：在 .env.local 設 VITE_DEV_PREVIEW=1 時開啟。
// 開啟後跳過 LINE 登入（用一組假會員），但資料仍連「真正的 Supabase」。正式環境不會開。
const DEV_PREVIEW = import.meta.env.VITE_DEV_PREVIEW === "1";

// ─── Main App ─────────────────────────────────────────────────────
function MainApp({lineUser,data,setData}){
  const [tab,setTab]=useState("catalog");
  const [cart,setCart]=useState([]);
  const [toast,setToast]=useState(null);
  const [member,setMember]=useState(null); // null=未載入, {}=載完但沒資料
  const [memberLoaded,setMemberLoaded]=useState(false);
  const [showCart,setShowCart]=useState(false);
  const [shopeeUrl,setShopeeUrl]=useState("");
  const [autoCancelHours,setAutoCancelHours]=useState(36);

  // 個資完整性檢查:四個必填欄位都要有值
  const isProfileComplete=!!(member?.community_name?.trim()&&member?.ig_threads?.trim()&&member?.recipient_name?.trim()&&member?.phone?.trim());

  // 抽出載入函式,可重用
  const reloadData = useCallback(async ()=>{
    try {
      const [ordersRes, productsRes, catRes, wishlistRes, annRes] = await Promise.all([
        supabase.from("orders").select("*, items:order_items(*)").eq("customer_line_id",lineUser.userId).order("created_at",{ascending:false}),
        supabase.from("products").select("*, variants:product_variants(*)").eq("status","on").eq("archived",false).order("created_at",{ascending:false}),
        supabase.from("categories").select("*").order("sort_order",{ascending:true}),
        supabase.from("wishlist").select("*").eq("customer_line_id",lineUser.userId).order("created_at",{ascending:false}),
        supabase.from("announcements").select("*").order("created_at",{ascending:false}),
      ]);
      setData(d=>({
        ...d,
        orders: ordersRes.data ? ordersRes.data.map(o=>({...o, items: orderItemsToLegacy(o.items)})) : d.orders,
        products: productsRes.data || d.products,
        categories: catRes.data || d.categories,
        wishlist: wishlistRes.data || d.wishlist,
        announcements: annRes.data || d.announcements,
      }));
    } catch (e) { console.error("Reload 失敗:", e); }
  }, [lineUser.userId, setData]);

  useEffect(()=>{
    injectStyles();
    // 讀取自己的會員資料（RLS 會限定只讀得到本人）
    supabase.from("members").select("*").eq("line_user_id",lineUser.userId).single().then(({data:m})=>{setMember(m||{});setMemberLoaded(true);});
    reloadData(); // 初次載入（真資料）
    // 載入賣貨便連結 + 逾期自動取消時數
    Promise.all([
      supabase.from("settings").select("*").eq("key","shopee_ship_url").maybeSingle(),
      supabase.from("settings").select("*").eq("key","auto_cancel_hours").maybeSingle(),
    ]).then(([s1,s2])=>{
      if(s1.data?.value) setShopeeUrl(s1.data.value);
      if(s2.data?.value) setAutoCancelHours(Number(s2.data.value)||36);
    }).catch(()=>{});

    const channel=supabase.channel("realtime-all")
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"orders",filter:`customer_line_id=eq.${lineUser.userId}`},
        (payload)=>{
          setData(d=>({...d,orders:d.orders.map(o=>o.id===payload.new.id?{...o,...payload.new}:o)}));
          if(payload.new.status==="cancelled"&&payload.old?.status==="pending_review"){
            setToast("❌ 您的訂單已被拒絕並取消");setTab("orders");
          }
        }
      )
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"orders",filter:`customer_line_id=eq.${lineUser.userId}`},
        (payload)=>{setData(d=> d.orders.some(o=>o.id===payload.new.id) ? d : ({...d,orders:[payload.new,...d.orders]}));}
      )
      .on("postgres_changes",{event:"DELETE",schema:"public",table:"orders"},
        (payload)=>{setData(d=>({...d,orders:d.orders.filter(o=>o.id!==payload.old.id)}));setToast("🗑️ 一筆訂單已被刪除");}
      )
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"products"},
        (payload)=>{setData(d=>({...d,products:[...d.products,payload.new]}));}
      )
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"products"},
        (payload)=>{setData(d=>({...d,products:d.products.map(p=>p.id===payload.new.id?{...p,...payload.new}:p)}));}
      )
      .on("postgres_changes",{event:"DELETE",schema:"public",table:"products"},
        (payload)=>{setData(d=>({...d,products:d.products.filter(p=>p.id!==payload.old.id)}));}
      )
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"wishlist"},
        (payload)=>{setData(d=>({...d,wishlist:d.wishlist.map(w=>w.id===payload.new.id?{...w,...payload.new}:w)}));}
      )
      .on("postgres_changes",{event:"DELETE",schema:"public",table:"wishlist"},
        (payload)=>{setData(d=>({...d,wishlist:d.wishlist.filter(w=>w.id!==payload.old.id)}));}
      )
      .subscribe((status)=>{
        console.log("📡 客人端 Realtime status:", status);
      });

    // 60 秒輪詢備援
    const heartbeat = setInterval(() => { reloadData(); }, 60000);

    return()=>{ supabase.removeChannel(channel); clearInterval(heartbeat); };
  },[reloadData,lineUser.userId,setData]);

  // 切換分頁時自動拉最新資料
  useEffect(()=>{
    if (["catalog","orders","shipments","wishlist"].includes(tab)) {
      reloadData();
    }
  }, [tab, reloadData]);

  const myOrders=data.orders.filter(o=>o.customer_line_id===lineUser.userId&&!o.archived);
  const myWishes=data.wishlist.filter(w=>w.customer_line_id===lineUser.userId);

  const addToCart=item=>{
    const safe={...item,name:sanitize(item.name,100),price:safePrice(item.price)};
    setCart(p=>{const ex=p.find(x=>x.id===safe.id);return ex?p.map(x=>x.id===safe.id?{...x,qty:Math.min(x.qty+1,99)}:x):[...p,{...safe,qty:1,note:""}];});
    setToast("已加入購物車 🛍");
  };
  const updateCartQty=(id,delta)=>setCart(p=>p.map(c=>c.id===id?{...c,qty:Math.max(1,Math.min(99,c.qty+delta))}:c));
  const updateCartNote=(id,note)=>setCart(p=>p.map(c=>c.id===id?{...c,note:sanitize(note,200)}:c));
  const removeFromCart=id=>setCart(p=>p.filter(c=>c.id!==id));

  const submitOrder=async(payInfo={})=>{
    if(!cart.length)return;
    const no=secureOrderNo();
    const ship = payInfo.ship || {};
    // 訂單主檔資料（實際建立由 place_order RPC 在一個交易內完成，並原子扣現貨庫存）
    const p_order={
      no,
      customer_name: sanitize(lineUser.name,50)||"匿名",
      total: cart.reduce((s,c)=>s+safePrice(c.price)*safeQty(c.qty),0),
      deposit_paid: Number(payInfo.payAmount) || 0,
      deposit_last5: sanitize(payInfo.payLast5 || "", 5),
      deposit_bank: sanitize(payInfo.payBank || "", 100),
      recipient_name: sanitize(ship.recipient_name || "", 50),
      recipient_phone: sanitize(ship.recipient_phone || "", 20),
      recipient_store: sanitize(ship.recipient_store || "", 100),
      delivery_method: sanitize(payInfo.deliveryMethod || "shopee", 20),
    };
    const p_items=cart.map(c=>{
      const pay={ payment_type: c.payment_type||"full", deposit_amount: Number(c.deposit_amount)||0, cost: Number(c.cost)||0 };
      if(c.variant_id){
        // 有 variant_id（代購或現貨皆是）→ RPC 依 variant 是否有庫存決定要不要扣
        return { product_name: sanitize(c.product_name||c.name,100), spec: sanitize(c.spec||"",100), qty: safeQty(c.qty), price: safePrice(c.price), image: c.image||"", note: sanitize(c.note||"",200), variant_id: c.variant_id, ...pay };
      }
      const{mainName,variants}=parseItemName(sanitize(c.name,100));
      const spec=variants.map(v=>v.label?`${v.label}：${v.value}`:v.value).join(" / ");
      return { product_name: mainName, spec, qty: safeQty(c.qty), price: safePrice(c.price), image: c.image||"", note: sanitize(c.note||"",200), variant_id: null, ...pay };
    });
    try{
      const{data:savedOrder,error}=await supabase.rpc("place_order",{ p_order, p_items });
      if(error)throw error;
      const legacyItems=orderItemsToLegacy(p_items.map(it=>({product_name:it.product_name,spec:it.spec,qty:it.qty,price:it.price,image:it.image,note:it.note})));
      setData(d=>({...d,orders:[{...savedOrder,items:legacyItems},...d.orders]}));
      setCart([]);setShowCart(false);setTab("orders");
      setToast(payInfo.payAmount>0?`訂單已送出 · 已記錄匯款 NT$${payInfo.payAmount} 🌸`:"訂單已送出 🌸");
      reloadData(); // 刷新現貨庫存
    }catch(e){
      console.error(e);
      const raw=e.message||"";
      alert(
        raw.includes("OUT_OF_STOCK")    ? "很抱歉，部分現貨剛售完或庫存不足，請調整數量後再試" :
        raw.includes("TOO_MANY_ITEMS")  ? "單筆訂單最多 50 項商品，請分批下單" :
        raw.includes("BAD_QTY")         ? "單項數量須在 1〜99 之間" :
        raw.includes("BAD_PRICE")       ? "手動輸入的金額超出範圍，請確認後再試" :
        ("下單失敗:"+(raw||"請稍後再試")));
      reloadData();
    }
  };

  const addWish=async(name,note,imgUrl,link)=>{
    const n=sanitize(name,100);if(!n)return;
    const wishData={customer_line_id:lineUser.userId,customer_name:sanitize(lineUser.name,50)||"匿名",name:n,note:sanitize(note,200),img_url:sanitize(imgUrl,500),link:sanitize(link,500),status:"searching"};
    try{
      const{data:saved,error}=await supabase.from("wishlist").insert([wishData]).select().single();
      if(error)throw error;
      setData(d=>({...d,wishlist:[saved,...d.wishlist]}));
    }catch{setData(d=>({...d,wishlist:[{...wishData,id:secureUid(),created_at:new Date().toISOString()},...d.wishlist]}));}
    setToast("許願已送出 🌸");
  };

  const deleteWish=async(id)=>{
    try{
      const{error}=await supabase.from("wishlist").delete().eq("id",id);
      if(error)throw error;
      setData(d=>({...d,wishlist:d.wishlist.filter(w=>w.id!==id)}));
      setToast("已刪除許願");
    }catch{setToast("刪除失敗");}
  };

  const logout = async () => {
    try { await supabase.auth.signOut({ scope: "local" }); } catch {}
    if (typeof liff !== "undefined") liff.logout();
  };

  // 頁面標題
  const PAGE_TITLE={
    catalog:"商品",profile:`Hi, ${lineUser.name}`,
    wishlist:"許願清單",orders:"我的訂單",shipments:"出貨紀錄",
  };

  // member 還沒載入完 → 顯示載入畫面
  if(!memberLoaded){
    return(
      <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}>
        <div style={{width:24,height:24,borderRadius:"50%",border:`2px solid ${C.faint}`,borderTopColor:C.accent,animation:"spin 1s linear infinite"}}/>
        <div style={{fontSize:12,color:C.faint,letterSpacing:.5}}>載入會員資料</div>
      </div>
    );
  }

  // 個資未填齊 → 強制顯示填寫頁(沒有 BottomNav、沒有購物車、沒有登出以外的功能)
  if(!isProfileComplete){
    return(
      <div style={{minHeight:"100vh",background:C.bg,maxWidth:480,margin:"0 auto",paddingBottom:60}}>
        <div style={{padding:"20px 20px 0",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:C.bg,zIndex:50,paddingBottom:12,borderBottom:`1px solid ${C.borderLight}`}}>
          <div style={{fontSize:18,fontWeight:600,color:C.text,letterSpacing:.3}}>建立會員資料</div>
          <button onClick={logout} style={{background:"none",border:"none",fontSize:12,color:C.faint,cursor:"pointer"}}>登出</button>
        </div>
        <ProfileTab member={member} setMember={setMember} lineUser={lineUser} setToast={setToast} forced={true}/>
        {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
      </div>
    );
  }

  return(
    <div style={{minHeight:"100vh",background:C.bg,maxWidth:480,margin:"0 auto",paddingBottom:60}}>
      {/* Top header */}
      <div style={{padding:"20px 20px 0",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:C.bg,zIndex:50,paddingBottom:12,borderBottom:`1px solid ${C.borderLight}`}}>
        <div style={{fontSize:18,fontWeight:600,color:C.text,letterSpacing:.3}}>{PAGE_TITLE[tab]||""}</div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {tab==="catalog"&&(
            <button onClick={()=>setShowCart(true)} style={{position:"relative",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",width:36,height:36}}>
              <Icon name="catalog" size={22} color={C.textMid}/>
              {cart.length>0&&<span style={{position:"absolute",top:0,right:0,background:C.accent,color:"#fff",fontSize:8,width:14,height:14,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{cart.reduce((s,c)=>s+c.qty,0)}</span>}
            </button>
          )}
          <button onClick={logout} style={{background:"none",border:"none",fontSize:12,color:C.faint,cursor:"pointer"}}>登出</button>
        </div>
      </div>

      {/* Content */}
      {tab==="profile"&&<ProfileTab member={member} setMember={setMember} lineUser={lineUser} setToast={setToast}/>}
      {tab==="catalog"&&<CatalogTab products={data.products} categories={data.categories} cart={cart} onAdd={addToCart} showCart={showCart} setShowCart={setShowCart} updateCartQty={updateCartQty} updateCartNote={updateCartNote} removeFromCart={removeFromCart} submitOrder={submitOrder} announcements={data.announcements} member={member} autoCancelHours={autoCancelHours}/>}
      {tab==="wishlist"&&<WishlistTab wishes={myWishes} onAddWish={addWish} onDeleteWish={deleteWish} onAddToCart={addToCart} setTab={setTab}/>}
      {tab==="orders"&&<OrdersTab orders={myOrders}/>}
      {tab==="shipments"&&<ShipmentsTab orders={myOrders} shopeeUrl={shopeeUrl}/>}

      {/* Bottom Nav */}
      <BottomNav tab={tab} setTab={setTab} cartCount={cart.reduce((s,c)=>s+c.qty,0)}/>

      {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────
export default function App(){
  const [session,setSession]=useState(undefined); // undefined=載入中, null=未登入
  const [lineUser,setLineUser]=useState(null);
  const [data,setData]=useState(null);

  // 追蹤登入狀態：重整後由 getSession 還原；登入/登出由 onAuthStateChange 反映
  useEffect(()=>{
    injectStyles();
    supabase.auth.getSession().then(({data})=>setSession(data.session??null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e,s)=>setSession(s??null));
    return ()=>sub.subscription.unsubscribe();
  },[]);

  // 有 session → 載入該身分資料；無 session → 清空
  useEffect(()=>{
    if(session===undefined)return;
    if(!session){ setLineUser(null); setData(null); return; }
    const acc=FAKE_ACCOUNTS.find(a=>a.email===session.user.email);
    const meta=session.user.user_metadata||{};
    setLineUser({ name: acc?.name || meta.name || (session.user.email?"客人":"訪客"), userId: session.user.id, pictureUrl: meta.picture||"" });
    setData({products:[],categories:[],orders:[],wishlist:[],announcements:[]}); // 初始空；由 MainApp reloadData 一次載入
  },[session]);

  // 登入方式（登入後由上面的 onAuthStateChange 自動接手載入資料）
  const onPickFake = async (account)=>{ try{ await signInFakeLine(account); }catch(e){ alert(e.message||String(e)); } };
  const onGuest = async ()=>{ try{ await ensureCustomerSession(); }catch(e){ alert("匿名登入失敗（請先在 Supabase 開啟 Anonymous sign-ins）："+(e.message||e)); } };
  const onLineSuccess = async (lineProfile)=>{ try{ await ensureCustomerSession(lineProfile); }catch(e){ alert(e.message||String(e)); } };

  const loadingScreen = (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}>
      <div style={{width:24,height:24,borderRadius:"50%",border:`2px solid ${C.faint}`,borderTopColor:C.accent,animation:"spin 1s linear infinite"}}/>
      <div style={{fontSize:12,color:C.faint,letterSpacing:.5}}>載入中</div>
    </div>
  );
  if(session===undefined) return loadingScreen;
  if(!session) return <LineLogin onSuccess={onLineSuccess} onPickFake={onPickFake} onGuest={onGuest} showTest={DEV_PREVIEW}/>;
  if(!data) return loadingScreen;
  return<MainApp lineUser={lineUser} data={data} setData={setData}/>;
}
