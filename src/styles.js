import { C } from "./theme";

// ─── 全域樣式注入 ─────────────────────────────────────────────────
export const injectStyles = () => {
  if(document.getElementById("kr-styles"))return;
  const s=document.createElement("style");
  s.id="kr-styles";
  s.textContent=`
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;600&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:${C.bg};color:${C.text};font-family:'Noto Sans TC',sans-serif;min-height:100vh;-webkit-font-smoothing:antialiased}
    ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:${C.faint};border-radius:99px}
    input,select,textarea,button{font-family:'Noto Sans TC',sans-serif;outline:none}
    @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
    @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
    @keyframes shimmer{from{opacity:.5}to{opacity:1}}
    .fadeUp{animation:fadeUp .35s cubic-bezier(.16,1,.3,1) both}
    input[type=number]{-moz-appearance:textfield}
    input::-webkit-inner-spin-button,input::-webkit-outer-spin-button{-webkit-appearance:none}
    .nav-btn{padding:9px 18px;border-radius:99px;border:1.5px solid ${C.border};background:transparent;color:${C.muted};font-size:13px;cursor:pointer;transition:all .2s;white-space:nowrap;font-weight:400;letter-spacing:.3px}
    .nav-btn.on{background:${C.accentBg};color:${C.accent};border-color:${C.accent}50;font-weight:500}
    .nav-btn.danger{color:${C.red};border-color:${C.red}40;background:${C.redBg}}
  `;
  document.head.appendChild(s);
};
