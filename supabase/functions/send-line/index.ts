// Supabase Edge Function：send-line
// 後台「LINE 通知」群發/單發。只有 admin 能呼叫。
// 收 { customerIds: string[], message: string }（customerIds = Supabase auth uid）
// 流程：驗證呼叫者是 admin → 用 service_role 讀每個 user 的 user_metadata.line_user_id
//        → 用 LINE Messaging API push 推播。
// 部署：supabase functions deploy send-line
// 需設密鑰：LINE_MESSAGING_TOKEN（Messaging API channel 的 Channel access token）
// 前提：① Messaging channel 與 Login channel 在「同一個 provider」（userId 才通用）
//        ② 客人已加你的官方帳號為好友（LINE 規則：只能推播給好友）
//        SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY 由平台自動注入。
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS：設了 ALLOWED_ORIGIN（如 https://xxx.pages.dev）就只允許該網域；未設回退 *（開發用）
const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const token = Deno.env.get("LINE_MESSAGING_TOKEN");
    if (!token) return json({ error: "尚未設定 LINE_MESSAGING_TOKEN（Messaging API channel access token）" }, 400);

    const { customerIds, message } = await req.json();
    if (!message || !String(message).trim()) return json({ error: "訊息不可空白" }, 400);
    if (!Array.isArray(customerIds) || customerIds.length === 0) return json({ error: "沒有收件人" }, 400);

    // 1) 驗證呼叫者是 admin（用呼叫者的 JWT 跑 is_admin）
    const authHeader = req.headers.get("Authorization") || "";
    const caller = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: isAdmin } = await caller.rpc("is_admin");
    if (isAdmin !== true) return json({ error: "forbidden" }, 403);

    // 2) 逐位解析 LINE userId（存在 auth user_metadata）並推播
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const text = String(message).slice(0, 4900);
    let sent = 0, skipped = 0;
    for (const cid of customerIds) {
      let lineId: string | null = null;
      try { const { data } = await admin.auth.admin.getUserById(cid); lineId = data?.user?.user_metadata?.line_user_id || null; } catch { lineId = null; }
      if (!lineId) { skipped++; continue; }   // 手動客人/未綁 LINE → 跳過
      const res = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ to: lineId, messages: [{ type: "text", text }] }),
      });
      if (res.ok) sent++; else skipped++;   // 未加好友/封鎖 → LINE 回非 200 → 計入 skipped
    }
    return json({ sent, skipped });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
