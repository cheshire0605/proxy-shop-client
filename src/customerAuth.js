import { supabase } from "./supabase";

const DEV_PREVIEW = import.meta.env.VITE_DEV_PREVIEW === "1";

// 確保「客人」有一個 Supabase 登入 session。
// RLS 需要它來認得「這是哪個客人」。回傳該 session 的 user.id，
// 作為客人的識別 id（存進 orders.customer_line_id、members.line_user_id…）。
export async function ensureCustomerSession(lineProfile){
  // 已有 session（reload 後 localStorage 還在）就沿用
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session.user.id;

  if (DEV_PREVIEW) {
    // 本地開發：匿名登入產生一個「假客人」身分
    // （需先在 Supabase → Authentication → Providers 開啟 Anonymous sign-ins）
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    return data.user.id;
  }

  // ══════════════════════════════════════════════════════════════
  // 【要串接 LINE 的地方 — 待實作】
  // 正式環境流程：
  //   1) 客人用 LINE 登入後，用 liff.getIDToken() 取得 idToken
  //   2) 呼叫 Edge Function（例如 line-auth）把 idToken 交給後端驗證
  //   3) 後端（service key）建立/登入對應的 Supabase 使用者，回傳 session
  //   4) 前端 supabase.auth.setSession(session)，回傳 session.user.id
  // 範例（待 Edge Function 完成後啟用）：
  //   const { data, error } = await supabase.functions.invoke("line-auth", {
  //     body: { idToken: lineProfile?.idToken },
  //   });
  //   if (error) throw error;
  //   await supabase.auth.setSession(data.session);
  //   return data.session.user.id;
  //
  // 註：屆時 members 可另存「真正的 LINE userId」欄位，
  //     但『身分識別』一律用 Supabase 的 user.id（auth.uid()）。
  // ══════════════════════════════════════════════════════════════
  throw new Error("LINE 登入尚未串接後端 session（見 src/customerAuth.js 待實作區塊）");
}

// 【開發用｜LINE 串接的替身】以「假 LINE 帳號」登入。
// 實際是登入一個 Supabase 測試帳號 → 取得穩定身分(auth.uid)。
// ★正式串接 LINE 時：把「呼叫本函式」改成「LINE idToken → Edge Function 換 session」即可，
//   其餘流程（handleLogin、用 uid 當身分…）完全不用動。
export async function signInFakeLine(account){
  let { data, error } = await supabase.auth.signInWithPassword({ email: account.email, password: account.password });
  if (error) {
    // 帳號還沒建 → 嘗試註冊（需 Supabase 關閉 Email 確認才會自動登入）
    const up = await supabase.auth.signUp({ email: account.email, password: account.password });
    if (up.error) throw up.error;
    if (up.data.session) return up.data.user.id;
    ({ data, error } = await supabase.auth.signInWithPassword({ email: account.email, password: account.password }));
    if (error) throw new Error("測試帳號無法登入：請在 Supabase → Authentication → Providers → Email 關閉「Confirm email」，或手動建立帳號 " + account.email);
  }
  return data.user.id;
}
