import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import AdminApp from './admin/AdminApp.jsx'

// 全域：滑鼠滾輪不改變數字欄位的值（滾到 number 欄位時讓它失焦，滾輪只捲動頁面）
document.addEventListener('wheel', (e) => {
  const el = document.activeElement
  if (el && el.tagName === 'INPUT' && el.type === 'number' && el === e.target) el.blur()
}, { passive: true })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* 後台：/admin/... */}
        <Route path="/admin/*" element={<AdminApp />} />
        {/* 客人端：其餘所有路徑 */}
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
