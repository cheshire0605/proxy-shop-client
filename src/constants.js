import { C } from "./theme";

export const APP_NAME = "下單系統";

// 訂單/出貨狀態對照（供 StatusPill 顯示；涵蓋訂單層級與出貨層級的值）
export const ORDER_STATUS = {
  pending_review: { label:"審核中",  color:C.blue,   bg:C.blueBg   },
  active:         { label:"進行中",  color:C.amber,  bg:C.amberBg  },
  pending:        { label:"待處理",  color:C.amber,  bg:C.amberBg  },
  preparing:      { label:"備貨中",  color:C.amber,  bg:C.amberBg  },
  shipped:        { label:"已寄出",  color:C.purple, bg:C.purpleBg },
  arrived:        { label:"已到台",  color:C.accent, bg:C.accentBg },
  completed:      { label:"已完成",  color:C.green,  bg:C.greenBg  },
  cancelled:      { label:"已取消",  color:C.red,    bg:C.redBg    },
};

// 台灣銀行清單（含代號）— 結帳匯款銀行下拉用
export const TW_BANKS = [
  { code:"004", name:"臺灣銀行" }, { code:"005", name:"土地銀行" }, { code:"006", name:"合作金庫" },
  { code:"007", name:"第一銀行" }, { code:"008", name:"華南銀行" }, { code:"009", name:"彰化銀行" },
  { code:"011", name:"上海商銀" }, { code:"012", name:"台北富邦" }, { code:"013", name:"國泰世華" },
  { code:"016", name:"高雄銀行" }, { code:"017", name:"兆豐銀行" }, { code:"018", name:"農業金庫" },
  { code:"021", name:"花旗(台灣)" }, { code:"025", name:"首都銀行" }, { code:"039", name:"澳盛銀行" },
  { code:"040", name:"中華開發" }, { code:"050", name:"臺灣企銀" }, { code:"052", name:"渣打銀行" },
  { code:"053", name:"台中商銀" }, { code:"054", name:"京城銀行" }, { code:"081", name:"匯豐(台灣)" },
  { code:"101", name:"瑞興銀行" }, { code:"102", name:"華泰銀行" }, { code:"103", name:"臺灣新光商銀" },
  { code:"108", name:"陽信銀行" }, { code:"118", name:"板信銀行" }, { code:"147", name:"三信商銀" },
  { code:"700", name:"中華郵政" }, { code:"803", name:"聯邦銀行" }, { code:"805", name:"遠東銀行" },
  { code:"806", name:"元大銀行" }, { code:"807", name:"永豐銀行" }, { code:"808", name:"玉山銀行" },
  { code:"809", name:"凱基銀行" }, { code:"810", name:"星展(台灣)" }, { code:"812", name:"台新銀行" },
  { code:"815", name:"日盛銀行" }, { code:"816", name:"安泰銀行" }, { code:"822", name:"中國信託" },
  { code:"823", name:"將來銀行" }, { code:"824", name:"連線銀行(LINE Bank)" }, { code:"826", name:"樂天國際銀行" },
];

