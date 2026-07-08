// ─── 操作日誌：記憶體（即時顯示）＋ 同步寫入 audit_logs 表（持久化，admin-only）──
import { supabase } from "../supabase";

let entries = [];
let subs = [];
let seq = 0;

export const logAction = (action, detail = "") => {
  entries.unshift({ id: ++seq, action, detail, time: new Date().toLocaleString("zh-TW") });
  if (entries.length > 100) entries.pop();
  subs.forEach(fn => fn(entries.slice()));
  // 持久化（失敗不影響操作本身）
  supabase.from("audit_logs").insert([{ action, detail }]).then(({ error }) => { if (error) console.warn("audit_logs 寫入失敗:", error.message); });
};
export const getAuditLog = () => entries.slice();
export const subscribeAudit = (fn) => { subs.push(fn); return () => { subs = subs.filter(s => s !== fn); }; };
