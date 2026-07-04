import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "../supabase";
import { C } from "../theme";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminLayout } from "./AdminLayout";
import { OrdersPage } from "./pages/OrdersPage";
import { OrderDetailPage } from "./pages/OrderDetailPage";
import { DistributionPage } from "./pages/DistributionPage";
import { ProductsPage } from "./pages/ProductsPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { StockLogPage } from "./pages/StockLogPage";
import { ExportPage } from "./pages/ExportPage";

export default function AdminApp(){
  const [session, setSession] = useState(undefined); // undefined=載入中
  const [isAdmin, setIsAdmin] = useState(undefined); // undefined=檢查中

  useEffect(()=>{
    // 後台一律需要登入（Supabase Auth），不論本地或正式
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // 光「有登入」還不夠：必須在 admin 名單內。RLS 也會擋資料，這裡先擋掉後台 UI。
  useEffect(()=>{
    if (session === undefined) return;
    if (!session) { setIsAdmin(false); return; }
    setIsAdmin(undefined);
    supabase.rpc("is_admin").then(({ data, error }) => setIsAdmin(!error && data === true));
  }, [session]);

  const centered = {minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,background:C.bg};
  if (session === undefined || (session && isAdmin === undefined)) return <div style={centered}>載入中…</div>;
  if (!session || !isAdmin) return <AdminLogin notAdmin={!!session && !isAdmin}/>;

  return (
    <Routes>
      <Route element={<AdminLayout/>}>
        <Route index element={<Navigate to="orders" replace/>}/>
        <Route path="orders" element={<OrdersPage/>}/>
        <Route path="orders/:id" element={<OrderDetailPage/>}/>
        <Route path="distribution" element={<DistributionPage/>}/>
        <Route path="products" element={<ProductsPage/>}/>
        <Route path="categories" element={<CategoriesPage/>}/>
        <Route path="stocklog" element={<StockLogPage/>}/>
        <Route path="export" element={<ExportPage/>}/>
        <Route path="*" element={<Navigate to="orders" replace/>}/>
      </Route>
    </Routes>
  );
}
