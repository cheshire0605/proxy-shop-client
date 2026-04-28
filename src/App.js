import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://pdvoxaluahzjnhvtirdi.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkdm94YWx1YWh6am5odnRpcmRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MjA2OTcsImV4cCI6MjA5MjA5NjY5N30.xS48Mk2sN-RNqwV4s6hamYfOUpqZZe3XXkB-xv8DHeM'

export const isConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY)
export const supabase = isConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null

const guard = () => { if (!supabase) throw new Error('Supabase 尚未設定') }

// ─── Orders ──────────────────────────────────────────────────────

export async function fetchOrders(customerId = null) {
  guard()
  let query = supabase.from('orders').select('*').order('created_at', { ascending: false })
  if (customerId) query = query.eq('customer_line_id', customerId)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createOrder(order) {
  guard()
  const { data, error } = await supabase.from('orders').insert([order]).select().single()
  if (error) throw error
  return data
}

export async function updateOrderStatus(orderId, status) {
  guard()
  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
  if (error) throw error
}

export async function updateOrderItems(orderId, items, total, profit) {
  guard()
  const { error } = await supabase
    .from('orders')
    .update({ items, total, profit, updated_at: new Date().toISOString() })
    .eq('id', orderId)
  if (error) throw error
}

export async function deleteOrder(orderId) {
  guard()
  const { error } = await supabase.from('orders').delete().eq('id', orderId)
  if (error) throw error
}

// ─── Products ────────────────────────────────────────────────────

export async function fetchProducts() {
  guard()
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function upsertProduct(product) {
  guard()
  const { data, error } = await supabase.from('products').upsert([product]).select().single()
  if (error) throw error
  return data
}

export async function deleteProduct(productId) {
  guard()
  const { error } = await supabase.from('products').delete().eq('id', productId)
  if (error) throw error
}

// ─── In-Stock ────────────────────────────────────────────────────

export async function fetchInStock() {
  guard()
  const { data, error } = await supabase.from('in_stock').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function upsertInStock(item) {
  guard()
  const { data, error } = await supabase.from('in_stock').upsert([item]).select().single()
  if (error) throw error
  return data
}

export async function deleteInStock(id) {
  guard()
  const { error } = await supabase.from('in_stock').delete().eq('id', id)
  if (error) throw error
}

// ─── Announcements ───────────────────────────────────────────────

export async function fetchAnnouncements() {
  guard()
  const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function upsertAnnouncement(ann) {
  guard()
  const { data, error } = await supabase.from('announcements').upsert([ann]).select().single()
  if (error) throw error
  return data
}

export async function deleteAnnouncement(id) {
  guard()
  const { error } = await supabase.from('announcements').delete().eq('id', id)
  if (error) throw error
}

// ─── Wishlist ────────────────────────────────────────────────────

export async function fetchWishlist(customerId = null) {
  guard()
  let query = supabase.from('wishlist').select('*').order('created_at', { ascending: false })
  if (customerId) query = query.eq('customer_line_id', customerId)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createWish(wish) {
  guard()
  const { data, error } = await supabase.from('wishlist').insert([wish]).select().single()
  if (error) throw error
  return data
}

export async function updateWishStatus(id, status) {
  guard()
  const { error } = await supabase.from('wishlist').update({ status }).eq('id', id)
  if (error) throw error
}

// ─── Members ─────────────────────────────────────────────────────

export async function fetchMember(lineUserId) {
  guard()
  const { data, error } = await supabase.from('members').select('*').eq('line_user_id', lineUserId).single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function fetchMembers() {
  guard()
  const { data, error } = await supabase.from('members').select('*').order('updated_at', { ascending: false })
  if (error) throw error
  return data
}

export async function upsertMember(member) {
  guard()
  const { data, error } = await supabase
    .from('members')
    .upsert([member], { onConflict: 'line_user_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Settings ────────────────────────────────────────────────────

export async function fetchSettings() {
  guard()
  const { data, error } = await supabase.from('settings').select('*').eq('key', 'jpy_rate').single()
  if (error) return { value: '0.26' }
  return data
}

export async function updateSetting(key, value) {
  guard()
  const { error } = await supabase.from('settings').upsert([{ key, value: String(value) }], { onConflict: 'key' })
  if (error) throw error
}

// ─── Real-time ────────────────────────────────────────────────────

export function subscribeToOrders(callback) {
  if (!supabase) return { unsubscribe: () => {} }
  return supabase
    .channel('orders-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, callback)
    .subscribe()
}

export function subscribeToWishlist(callback) {
  if (!supabase) return { unsubscribe: () => {} }
  return supabase
    .channel('wishlist-channel')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wishlist' }, callback)
    .subscribe()
}

export function subscribeToProducts(callback) {
  if (!supabase) return { unsubscribe: () => {} }
  return supabase
    .channel('products-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, callback)
    .subscribe()
}
