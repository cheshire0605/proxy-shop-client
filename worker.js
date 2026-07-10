// Cloudflare Worker 入口
// 唯一的後端工作：接住 7-11 賣貨便 EMap 選完門市後的「POST 回傳」，
// 把門市資料轉成 GET 參數 302 導回首頁（SPA 才讀得到）。其餘請求全部交給靜態資產。
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/store-callback") {
      // EMap 通常用 POST（form）回傳；也相容 GET query
      const body = {};
      if (request.method === "POST") {
        try { const form = await request.formData(); for (const [k, v] of form) body[k] = v; } catch {}
      }
      const q = url.searchParams;
      const pick = (...keys) => {
        for (const k of keys) { if (body[k]) return String(body[k]); const v = q.get(k); if (v) return v; }
        return "";
      };
      const stCode = pick("stCode", "storeid", "CVSStoreID");
      const stName = pick("stName", "storename", "CVSStoreName");
      const stAddr = pick("stAddr", "storeaddress", "CVSAddress");
      const to = `/?stCode=${encodeURIComponent(stCode)}&stName=${encodeURIComponent(stName)}&stAddr=${encodeURIComponent(stAddr)}`;
      return new Response(null, { status: 302, headers: { Location: to } });
    }

    // 其餘：靜態資產（含 SPA not_found_handling）
    return env.ASSETS.fetch(request);
  },
};
