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

