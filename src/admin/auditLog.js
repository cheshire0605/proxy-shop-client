// ─── 操作日誌（僅本次 Session，登出/重整後清除；正式版可改接後端）──
let entries = [];
let subs = [];
let seq = 0;

export const logAction = (action, detail = "") => {
  entries.unshift({ id: ++seq, action, detail, time: new Date().toLocaleString("zh-TW") });
  if (entries.length > 100) entries.pop();
  subs.forEach(fn => fn(entries.slice()));
};
export const getAuditLog = () => entries.slice();
export const subscribeAudit = (fn) => { subs.push(fn); return () => { subs = subs.filter(s => s !== fn); }; };
