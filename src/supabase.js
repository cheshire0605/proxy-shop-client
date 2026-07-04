// ─── Supabase 連線 ───────────────────────────────────────────────
// URL / anon key 由 .env 提供（VITE_SUPABASE_URL、VITE_SUPABASE_ANON_KEY）
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
