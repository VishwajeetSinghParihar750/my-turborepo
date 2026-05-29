import express from "express";
import Balance from "./classes/Balance";
import Orderbook from "./classes/Orderbook";
import type { ORDER } from "./types";
import Positions from "./classes/Positions";
import LiquidationEngine from "./classes/LiquidationEngine";

const app = express();
app.use(express.json());

// input is always correct
const BALANCE = new Balance();
const ORDERBOOK = new Orderbook();
const POSITIONS = new Positions();
const LIQUIDATION = new LiquidationEngine();

app.get("/api/reset", (req, res) => {
  BALANCE.reset();
  ORDERBOOK.reset();
  POSITIONS.reset();
  //
  res.status(200).json({ ok: true });
});

app.post("/api/orders", (req, res) => {
  const {
    userId,
    symbol,
    side,
    type,
    price,
    quantity,
    leverage,
    postOnly,
    clientOrderId,
  } = req.body as ORDER;

  let requiredBal = (price * quantity) / leverage;

  let userBalance = BALANCE.getBalance(userId);
  if (!userBalance || userBalance < requiredBal) {
    //
    res.status(200).json({
      status: "rejected",
      reason: "insufficient margin",
      fills: [],
      remainingQuantity: 0,
      cancelledQuantity: 10,
      margin: {
        locked: 0,
        used: 0,
        released: 0,
      },
    });
    return;
  }

  const order: ORDER = {
    ...req.body,
    filledQty: 0,
    orderId: clientOrderId,
  };

  // place in order book
  let { fills, order: placedOrder } = ORDERBOOK.createOrder(order);

  let { usersPnl, updatedPositions } = POSITIONS.applyFills(fills);

  // do current user margin calculations
  let lockedMargin = requiredBal;
  let usedMargin = 0;
  fills.forEach((fill) => {
    usedMargin += (fill.price * fill.quantity) / order.leverage;
  });
  let releasedMargin = lockedMargin - usedMargin;

  BALANCE.applyUsersPnl(usersPnl);

  //
  LIQUIDATION.handleUpdatedPositions(updatedPositions);

  //
  res.status(200).json({
    orderId: placedOrder.orderId,
    status: placedOrder.status,
    fills,
    reamainingQty: placedOrder.quantity - placedOrder.filledQty,
    cancellledQty:
      order.type == "market" ? placedOrder.quantity - placedOrder.filledQty : 0,

    margin: {
      locked: lockedMargin,
      used: usedMargin,
      released: order.type == "limit" ? 0 : releasedMargin,
    },
  });
});

app.post("/api/users", (req, res, next) => {
  const { userId, initialBalance } = req.body;

  BALANCE.addBalance(userId, initialBalance);

  res.status(200).json({ userId });
});

app.get("/api/users/:userId/balance", (req, res) => {
  //     {
  //   "userId": "alice",
  //   "availableBalance": 9475,
  //   "lockedMargin": 525,
  //   "totalEquity": 10000,
  //   "realizedPnl": 0
  // }
  const userId = req.params.userId;

  res.status(200).json({
    userId,
    availableBalance: BALANCE.getBalance(userId),
    lockedMargin: 0,
    totalEquity: 0,
    realizedPnl: BALANCE.getRealizedPnl(userId),
  });
});
app.get("/api/users/:userId/positions", (req, res) => {
  const userId = req.params.userId;

  res.status(200).json(POSITIONS.positions[userId]);
});
app.get("/api/orderbook/:symbol", (req, res) => {
  //
  res.status(200).json({
    symbol: "BTC-PERP",
    bids: ORDERBOOK.orderbook["BTC-PERP"].long,
    asks: ORDERBOOK.orderbook["BTC-PERP"].short,
  });
});

//todo
app.post("/api/mark-price", (req, res) => {
  const markPrice = req.body.markPrice;
  res.status(200).json({
    symbol: "BTC-PERP",
    markPrice,
    liquidations: [],
  });
});
app.post("/api/funding", (req, res) => {
  res.status(200).json({});
});
app.get("/api/insurance-fund/:symbol", (req, res) => {
  LIQUIDATION.fund += req.body.balance;
  res.status(200).json({
    symbol: "BTC-PERP",
    balance: LIQUIDATION.fund,
  });
});
app.get("/api/adl-events", (req, res) => {
  res.status(200).json({});
});

app.listen(3000);
