import { supabase } from "./supabase";

const DEV_PREVIEW = import.meta.env.VITE_DEV_PREVIEW === "1";

// 確保「客人」有一個 Supabase 登入 session。
// RLS 需要它來認得「這是哪個客人」。回傳該 session 的 user.id，
// 作為客人的識別 id（存進 orders.customer_line_id、members.line_user_id…）。
export async function ensureCustomerSession(lineProfile){
  // 已有 session（reload 後 localStorage 還在）就沿用
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session.user.id;

  // ── 真 LINE 登入：把 LINE idToken 交給 Edge Function 驗證 → 換 Supabase session ──
  // Edge Function 用 LINE 公鑰驗簽（非對稱），確認身分後回傳單次 token_hash，
  // 前端用 verifyOtp 換到正式 session；身分識別一律用 Supabase 的 auth.uid()。
  if (lineProfile?.idToken) {
    const { data, error } = await supabase.functions.invoke("line-auth", { body: { idToken: lineProfile.idToken } });
    if (error) throw new Error("LINE 驗證失敗：" + (error.message || error));
    if (!data?.token_hash) throw new Error("LINE 驗證回應異常：" + (data?.error || "無 token"));
    const { error: e2 } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: data.token_hash });
    if (e2) throw e2;
    const { data: { session: s } } = await supabase.auth.getSession();
    return s.user.id;
  }

  // ── 訪客（僅本地開發）：匿名登入產生假身分（需開 Anonymous sign-ins）──
  if (DEV_PREVIEW) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    return data.user.id;
  }

  throw new Error("請用 LINE 登入");
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
