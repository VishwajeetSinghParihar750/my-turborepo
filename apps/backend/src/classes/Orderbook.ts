import { OrderedMap, LinkList } from "js-sdsl";
import type { FILL_INFO, ORDER } from "../types";

export default class Orderbook {
  orderbook: Record<
    "BTC-PERP",
    {
      long: OrderedMap<number, LinkList<ORDER>>;
      short: OrderedMap<number, LinkList<ORDER>>;
    }
  > = {
    "BTC-PERP": {
      long: new OrderedMap([], (x, y) => y - x),
      short: new OrderedMap(),
    },
  };

  reset() {
    this.orderbook = {
      "BTC-PERP": {
        long: new OrderedMap([], (x, y) => y - x),
        short: new OrderedMap(),
      },
    };
  }
  createOrder(order: ORDER): { fills: FILL_INFO[]; order: ORDER } {
    //  "userId": "alice",
    //   "symbol": "BTC-PERP",
    //   "side": "long",
    //   "type": "limit",
    //   "price": 105,
    //   "quantity": 5,
    //   "leverage": 1,
    //   "postOnly": false,
    //   "clientOrderId": "optional-client-id"
    // }
    //

    let fills: FILL_INFO[] = [];

    // find opposite orders
    let oppositeOrders =
      this.orderbook[order.symbol][order.side == "long" ? "short" : "long"];

    //  match as much we can
    while (order.filledQty < order.quantity && !oppositeOrders.empty()) {
      let bestPriceLevel = oppositeOrders.front()!;
      let [price, orders] = bestPriceLevel;

      if (price <= order.price == (order.side == "long")) {
        // should trade
        let tradePrice = Math.min(order.price, price);

        while (order.filledQty < order.quantity && !orders.empty()) {
          //
          let matchingOrder = orders.front()!;
          // match the order

          let tradeQty = Math.min(
            matchingOrder.quantity - matchingOrder.filledQty,
            order.quantity - order.filledQty,
          );

          // update fills
          fills.push({
            makerUserId: matchingOrder.orderId,
            makerOrderId: matchingOrder.orderId,
            takerUserId: order.userId,
            takerOrderId: order.orderId,
            price: tradePrice,
            quantity: tradeQty,
            longUserId:
              order.side == "long" ? order.userId : matchingOrder.userId,
            longOrderMargin:
              order.side == "long"
                ? (order.price * order.quantity) / order.leverage
                : (matchingOrder.price * matchingOrder.quantity) /
                  matchingOrder.leverage,
            shortOrderMargin:
              order.side == "short"
                ? (order.price * order.quantity) / order.leverage
                : (matchingOrder.price * matchingOrder.quantity) /
                  matchingOrder.leverage,
            shortOrderQty:
              order.side == "short" ? order.quantity : matchingOrder.quantity,
            longOrderQty:
              order.side == "long" ? order.quantity : matchingOrder.quantity,
          });

          // update filled qty
          order.filledQty += tradeQty;
          matchingOrder.filledQty += tradeQty;

          // remove from orderbook if filled
          if (matchingOrder.filledQty == matchingOrder.quantity) {
            orders.popFront();
          }
        }
      } else break;
    }

    // sit on orderbook if limit
    if (order.type == "limit" && order.filledQty != order.quantity) {
      // sit on orderbook
      let orders =
        this.orderbook["BTC-PERP"][order.side].getElementByKey(order.price) ||
        new LinkList();
      orders.pushBack(order);
      this.orderbook["BTC-PERP"][order.side].setElement(order.price, orders);
    }

    // return fills
    return { fills, order };
  }
}
