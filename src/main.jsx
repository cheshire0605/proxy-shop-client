import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
// 後台整包 code-split：客人端不下載後台程式，首載更輕
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'))

// 全域：滑鼠滾輪不改變數字欄位的值（滾到 number 欄位時讓它失焦，滾輪只捲動頁面）
document.addEventListener('wheel', (e) => {
  const el = document.activeElement
  if (el && el.tagName === 'INPUT' && el.type === 'number' && el === e.target) el.blur()
}, { passive: true })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* 後台：/admin/...（lazy 載入） */}
        <Route path="/admin/*" element={<Suspense fallback={<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#999"}}>載入後台…</div>}><AdminApp /></Suspense>} />
        {/* 客人端：其餘所有路徑 */}
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
