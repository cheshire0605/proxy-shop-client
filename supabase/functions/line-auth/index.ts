// Supabase Edge Function：line-auth
// 收 LINE idToken → 用 LINE 公鑰驗簽 → 建/取 Supabase 使用者 → 回單次 token_hash
// 部署：supabase functions deploy line-auth
// 需設密鑰：LINE_CHANNEL_ID（LINE Login channel 的 Channel ID）
//          （SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 由平台自動注入，無需手設）
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { idToken } = await req.json();
    if (!idToken) return json({ error: "missing idToken" }, 400);

    // 1) 驗證 LINE idToken（LINE 用其私鑰簽，此端點以其公鑰驗）
    const verifyRes = await fetch("https://api.line.me/oauth2/v2.1/verify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ id_token: idToken, client_id: Deno.env.get("LINE_CHANNEL_ID")! }),
    });
    const p = await verifyRes.json();
    if (!verifyRes.ok || !p.sub) return json({ error: "invalid LINE token", detail: p }, 401);

    const lineUserId = p.sub;                       // LINE 的唯一使用者 ID
    const email = `line_${lineUserId}@line.local`;  // 對應的 Supabase 帳號（決定性）

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // 2) 建立使用者（已存在則忽略），把 LINE 名稱/頭像放 user_metadata
    await admin.auth.admin.createUser({
      email, email_confirm: true,
      user_metadata: { line_user_id: lineUserId, name: p.name || "", picture: p.picture || "" },
    }).catch(() => { /* 已存在 → 忽略 */ });

    // 3) 產生單次 magiclink token_hash，讓前端 verifyOtp 換到正式 session
    const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    if (error) return json({ error: error.message }, 500);

    return json({
      token_hash: data.properties.hashed_token,
      line: { userId: lineUserId, name: p.name || "", picture: p.picture || "" },
    });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
