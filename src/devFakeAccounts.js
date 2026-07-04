// 假 LINE 帳號（僅本地開發用 VITE_DEV_PREVIEW=1）
// 這些其實是 Supabase Auth 的測試帳號，登入後得到「穩定身分(auth.uid)」，
// 用來模擬不同的 LINE 客人。正式版改為真正 LINE 登入（見 customerAuth.js）。
export const FAKE_ACCOUNTS = [
  { key:"alice", name:"測試客人 Alice", email:"alice@test.local", password:"test1234" },
  { key:"bob",   name:"測試客人 Bob",   email:"bob@test.local",   password:"test1234" },
  { key:"carol", name:"測試客人 Carol", email:"carol@test.local", password:"test1234" },
];
