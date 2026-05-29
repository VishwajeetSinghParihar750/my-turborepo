type SIDE = "long" | "short";
type TYPE = "market" | "limit";
type ORDER_STATUS = "filled" | "partially_filled";
type ORDER = {
  orderId: string;
  userId: string;
  symbol: "BTC-PERP";
  side: SIDE;
  type: TYPE;
  quantity: number;
  leverage: number;
  clientOrderId: string;
  price: number;
  filledQty: number;
  status: ORDER_STATUS;

  postOnly?: boolean;
};

type POSITION = {
  // {
  //     "symbol": "BTC-PERP",
  //     "side": "long",
  //     "quantity": 5,
  //     "averageEntryPrice": 105,
  //     "margin": 525,
  //     "unrealizedPnl": 0,
  //     "liquidationPrice": 90.5
  //   }

  symbol: "BTC-PERP";
  side: SIDE;
  quantity: number;
  averageEntryPrice: number;
  margin: number;
  liquidationPrice: number;
};

type FILL_INFO = {
  // "price": 105,
  //     "quantity": 5,
  //     "makerOrderId": "order-0",
  //     "makerUserId": "maker",
  //     "takerUserId": "alice"

  price: number;
  quantity: number;
  makerOrderId: string;
  makerUserId: string;
  takerOrderId: string;
  takerUserId: string;

  // we need this
  longUserId: string;
  longOrderMargin: number;
  longOrderQty: number;
  shortOrderMargin: number;
  shortOrderQty: number;

  //
};

export type { SIDE, TYPE, ORDER, POSITION, FILL_INFO };
