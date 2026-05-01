// ─── supabase.js ─────────────────────────────────────────────────
// 放在 src/ 資料夾
// .env 填入你的 Supabase URL 和 anon key

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ═══════════════════════════════════════════════════════════════
// CRUD Functions
// ═══════════════════════════════════════════════════════════════

// ─── Orders ──────────────────────────────────────────────────────

export async function fetchOrders(customerId = null) {
  let q = supabase.from('orders').select('*').order('created_at', { ascending: false })
  if (customerId) q = q.eq('customer_line_id', customerId)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function createOrder(order) {
  const { data, error } = await supabase.from('orders').insert([order]).select().single()
  if (error) throw error
  return data
}

export async function updateOrderStatus(orderId, status) {
  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
  if (error) throw error
}

export async function deleteOrder(orderId) {
  const { error } = await supabase.from('orders').delete().eq('id', orderId)
  if (error) throw error
}

// ─── Products ────────────────────────────────────────────────────

export async function fetchProducts() {
  const { data, error } = await supabase
    .from('products').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function upsertProduct(product) {
  const { data, error } = await supabase.from('products').upsert([product]).select().single()
  if (error) throw error
  return data
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

// ─── In-Stock ────────────────────────────────────────────────────

export async function fetchInStock() {
  const { data, error } = await supabase
    .from('in_stock').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function upsertInStock(item) {
  const { data, error } = await supabase.from('in_stock').upsert([item]).select().single()
  if (error) throw error
  return data
}

export async function deleteInStock(id) {
  const { error } = await supabase.from('in_stock').delete().eq('id', id)
  if (error) throw error
}

// ─── Announcements ───────────────────────────────────────────────

export async function fetchAnnouncements() {
  const { data, error } = await supabase
    .from('announcements').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function upsertAnnouncement(ann) {
  const { data, error } = await supabase.from('announcements').upsert([ann]).select().single()
  if (error) throw error
  return data
}

export async function deleteAnnouncement(id) {
  const { error } = await supabase.from('announcements').delete().eq('id', id)
  if (error) throw error
}

// ─── Wishlist ────────────────────────────────────────────────────

export async function fetchWishlist(customerId = null) {
  let q = supabase.from('wishlist').select('*').order('created_at', { ascending: false })
  if (customerId) q = q.eq('customer_line_id', customerId)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function createWish(wish) {
  const { data, error } = await supabase.from('wishlist').insert([wish]).select().single()
  if (error) throw error
  return data
}

export async function updateWishStatus(id, status) {
  const { error } = await supabase.from('wishlist').update({ status }).eq('id', id)
  if (error) throw error
}

// ─── Members ─────────────────────────────────────────────────────

export async function fetchMember(lineUserId) {
  const { data, error } = await supabase
    .from('members').select('*').eq('line_user_id', lineUserId).single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function upsertMember(member) {
  const { data, error } = await supabase
    .from('members')
    .upsert([member], { onConflict: 'line_user_id' })
    .select().single()
  if (error) throw error
  return data
}

// ─── Settings ────────────────────────────────────────────────────

export async function fetchSettings() {
  const { data, error } = await supabase
    .from('settings').select('*').eq('key', 'jpy_rate').single()
  if (error) return { value: '0.26' }
  return data
}

export async function updateSetting(key, value) {
  const { error } = await supabase
    .from('settings').upsert([{ key, value: String(value) }], { onConflict: 'key' })
  if (error) throw error
}

// ═══════════════════════════════════════════════════════════════
// Realtime Subscriptions
// ─────────────────────────────────────────────────────────────
//
// 使用方式（在 React useEffect 裡）：
//
//   useEffect(() => {
//     const sub = subscribeToXxx((payload) => { ... })
//     return () => sub.unsubscribe()   // 離開時清除
//   }, [])
//
// payload 格式：
//   payload.eventType  → 'INSERT' | 'UPDATE' | 'DELETE'
//   payload.new        → 變動後的新資料（INSERT/UPDATE）
//   payload.old        → 變動前的舊資料（UPDATE/DELETE）
//
// ═══════════════════════════════════════════════════════════════

// ─── 客人端 + 業者後台都需要的訂閱 ──────────────────────────────

/**
 * 訂閱訂單變動
 * 客人：只看自己的訂單狀態更新
 * 業者：監聽所有新訂單
 *
 * @param {function} onInsert - 收到新訂單時觸發
 * @param {function} onUpdate - 訂單狀態更新時觸發（老闆改狀態→客人即時看到）
 * @param {function} onDelete - 訂單被刪除時觸發
 * @param {string|null} filterCustomerId - 若傳入 LINE userId，只訂閱該客人的訂單
 */
export function subscribeToOrders({ onInsert, onUpdate, onDelete, filterCustomerId } = {}) {
  let channel = supabase.channel('realtime:orders')

  // 設定 filter
  const filterConfig = filterCustomerId
    ? { event: '*', schema: 'public', table: 'orders', filter: `customer_line_id=eq.${filterCustomerId}` }
    : { event: '*', schema: 'public', table: 'orders' }

  channel = channel.on('postgres_changes', filterConfig, (payload) => {
    if (payload.eventType === 'INSERT' && onInsert) onInsert(payload.new)
    if (payload.eventType === 'UPDATE' && onUpdate) onUpdate(payload.new, payload.old)
    if (payload.eventType === 'DELETE' && onDelete) onDelete(payload.old)
  })

  return channel.subscribe()
}

/**
 * 訂閱商品（代購目錄）變動
 * 業者新增/下架商品時，客人端即時反映
 */
export function subscribeToProducts({ onInsert, onUpdate, onDelete } = {}) {
  return supabase
    .channel('realtime:products')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
      if (payload.eventType === 'INSERT' && onInsert) onInsert(payload.new)
      if (payload.eventType === 'UPDATE' && onUpdate) onUpdate(payload.new, payload.old)
      if (payload.eventType === 'DELETE' && onDelete) onDelete(payload.old)
    })
    .subscribe()
}

/**
 * 訂閱現貨商品變動
 */
export function subscribeToInStock({ onInsert, onUpdate, onDelete } = {}) {
  return supabase
    .channel('realtime:in_stock')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'in_stock' }, (payload) => {
      if (payload.eventType === 'INSERT' && onInsert) onInsert(payload.new)
      if (payload.eventType === 'UPDATE' && onUpdate) onUpdate(payload.new, payload.old)
      if (payload.eventType === 'DELETE' && onDelete) onDelete(payload.old)
    })
    .subscribe()
}

/**
 * 訂閱公告變動
 * 業者發佈新公告時，客人端首頁即時出現
 */
export function subscribeToAnnouncements({ onInsert, onUpdate, onDelete } = {}) {
  return supabase
    .channel('realtime:announcements')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, (payload) => {
      if (payload.eventType === 'INSERT' && onInsert) onInsert(payload.new)
      if (payload.eventType === 'UPDATE' && onUpdate) onUpdate(payload.new, payload.old)
      if (payload.eventType === 'DELETE' && onDelete) onDelete(payload.old)
    })
    .subscribe()
}

/**
 * 訂閱許願清單變動
 * 業者標記「找到了」時，客人端即時更新
 */
export function subscribeToWishlist({ onInsert, onUpdate, filterCustomerId } = {}) {
  const filterConfig = filterCustomerId
    ? { event: '*', schema: 'public', table: 'wishlist', filter: `customer_line_id=eq.${filterCustomerId}` }
    : { event: '*', schema: 'public', table: 'wishlist' }

  return supabase
    .channel('realtime:wishlist')
    .on('postgres_changes', filterConfig, (payload) => {
      if (payload.eventType === 'INSERT' && onInsert) onInsert(payload.new)
      if (payload.eventType === 'UPDATE' && onUpdate) onUpdate(payload.new, payload.old)
    })
    .subscribe()
}

// ═══════════════════════════════════════════════════════════════
// React Hooks（直接在元件裡使用最方便）
// ═══════════════════════════════════════════════════════════════

/**
 * 【客人端用】useRealtimeCustomer
 *
 * 一個 hook 搞定客人端所有即時更新：
 * - 訂單狀態更新（業者改狀態→即時顯示）
 * - 商品新增/下架（業者操作→即時反映）
 * - 現貨上下架（同上）
 * - 公告發佈/修改（業者發→首頁即時出現）
 * - 許願狀態更新（業者標記找到→即時通知）
 *
 * 使用方式：
 *   在 MainApp 元件內：
 *   useRealtimeCustomer(lineUser.userId, setData)
 */
export function useRealtimeCustomer(lineUserId, setData) {
  // 需要從 react 引入 useEffect
  // 這裡寫成 plain function，讓使用者在 useEffect 呼叫

  return function setup() {
    const subs = []

    // 訂單狀態變動（只看自己的）
    subs.push(subscribeToOrders({
      filterCustomerId: lineUserId,
      onInsert: (newOrder) => {
        setData(d => ({ ...d, orders: [newOrder, ...d.orders] }))
      },
      onUpdate: (updated) => {
        setData(d => ({
          ...d,
          orders: d.orders.map(o => o.id === updated.id ? updated : o)
        }))
      },
      onDelete: (deleted) => {
        setData(d => ({ ...d, orders: d.orders.filter(o => o.id !== deleted.id) }))
      },
    }))

    // 商品目錄變動
    subs.push(subscribeToProducts({
      onInsert: (item) => {
        setData(d => ({ ...d, products: [item, ...d.products] }))
      },
      onUpdate: (updated) => {
        setData(d => ({
          ...d,
          products: d.products.map(p => p.id === updated.id ? updated : p)
        }))
      },
      onDelete: (deleted) => {
        setData(d => ({ ...d, products: d.products.filter(p => p.id !== deleted.id) }))
      },
    }))

    // 現貨變動
    subs.push(subscribeToInStock({
      onInsert: (item) => {
        setData(d => ({ ...d, inStock: [item, ...d.inStock] }))
      },
      onUpdate: (updated) => {
        setData(d => ({
          ...d,
          inStock: d.inStock.map(s => s.id === updated.id ? updated : s)
        }))
      },
      onDelete: (deleted) => {
        setData(d => ({ ...d, inStock: d.inStock.filter(s => s.id !== deleted.id) }))
      },
    }))

    // 公告變動
    subs.push(subscribeToAnnouncements({
      onInsert: (item) => {
        setData(d => ({ ...d, announcements: [item, ...d.announcements] }))
      },
      onUpdate: (updated) => {
        setData(d => ({
          ...d,
          announcements: d.announcements.map(a => a.id === updated.id ? updated : a)
        }))
      },
      onDelete: (deleted) => {
        setData(d => ({ ...d, announcements: d.announcements.filter(a => a.id !== deleted.id) }))
      },
    }))

    // 許願清單（只看自己的）
    subs.push(subscribeToWishlist({
      filterCustomerId: lineUserId,
      onInsert: (item) => {
        setData(d => ({ ...d, wishlist: [item, ...d.wishlist] }))
      },
      onUpdate: (updated) => {
        setData(d => ({
          ...d,
          wishlist: d.wishlist.map(w => w.id === updated.id ? updated : w)
        }))
      },
    }))

    // 回傳清除函式
    return () => subs.forEach(s => s.unsubscribe())
  }
}

/**
 * 【業者後台用】useRealtimeAdmin
 *
 * 業者後台即時更新：
 * - 新訂單進來立即出現 + 彈通知
 * - 商品/現貨/公告/許願的任何變動即時反映
 *
 * 使用方式：
 *   在 AdminDashboard 的 useEffect 裡：
 *
 *   useEffect(() => {
 *     const cleanup = useRealtimeAdmin(setData, showToast)
 *     return cleanup
 *   }, [])
 */
export function useRealtimeAdmin(setData, showToast) {
  return function setup() {
    const subs = []

    // 訂單（全部）
    subs.push(subscribeToOrders({
      onInsert: (newOrder) => {
        setData(d => ({ ...d, orders: [newOrder, ...d.orders] }))
        if (showToast) showToast(`🔔 收到新訂單！#${newOrder.no} · ${newOrder.customer_name}`)
      },
      onUpdate: (updated) => {
        setData(d => ({
          ...d,
          orders: d.orders.map(o => o.id === updated.id ? updated : o)
        }))
      },
      onDelete: (deleted) => {
        setData(d => ({ ...d, orders: d.orders.filter(o => o.id !== deleted.id) }))
      },
    }))

    // 許願（全部，有新許願通知業者）
    subs.push(subscribeToWishlist({
      onInsert: (item) => {
        setData(d => ({ ...d, wishlist: [item, ...d.wishlist] }))
        if (showToast) showToast(`⭐ ${item.customer_name} 許願了「${item.name}」`)
      },
      onUpdate: (updated) => {
        setData(d => ({
          ...d,
          wishlist: d.wishlist.map(w => w.id === updated.id ? updated : w)
        }))
      },
    }))

    // 商品同步（多裝置管理時有用）
    subs.push(subscribeToProducts({
      onInsert: (item) => setData(d => ({ ...d, products: [item, ...d.products] })),
      onUpdate: (updated) => setData(d => ({ ...d, products: d.products.map(p => p.id === updated.id ? updated : p) })),
      onDelete: (deleted) => setData(d => ({ ...d, products: d.products.filter(p => p.id !== deleted.id) })),
    }))

    // 現貨同步
    subs.push(subscribeToInStock({
      onInsert: (item) => setData(d => ({ ...d, inStock: [item, ...d.inStock] })),
      onUpdate: (updated) => setData(d => ({ ...d, inStock: d.inStock.map(s => s.id === updated.id ? updated : s) })),
      onDelete: (deleted) => setData(d => ({ ...d, inStock: d.inStock.filter(s => s.id !== deleted.id) })),
    }))

    return () => subs.forEach(s => s.unsubscribe())
  }
}
