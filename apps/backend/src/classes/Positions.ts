import type { POSITION, FILL_INFO } from "../types";

export default class Positions {
  positions: Record<string, POSITION> = {};
  reset() {
    this.positions = {};
  }

  applyFills(fills: FILL_INFO[]) {
    let usersPnl: Record<string, number> = {};

    let updatedPositions: Record<string, POSITION> = {};

    fills.forEach((fill) => {
      //
      const {
        makerOrderId,
        makerUserId,
        price,
        quantity,
        takerOrderId,
        takerUserId,
        longUserId,
        longOrderMargin,
        shortOrderMargin,
        longOrderQty,
        shortOrderQty,
      } = fill;

      //
      let shortUserId =
        longUserId == makerOrderId ? takerOrderId : makerOrderId;

      // update long user
      if (this.positions[longUserId]) {
        // todo
        let curSide = "long";
        let prevPosition = this.positions[longUserId];

        if (prevPosition.side == curSide) {
          // means just add positoins
          prevPosition.margin += longOrderMargin / longOrderQty;
          prevPosition.averageEntryPrice =
            (prevPosition.averageEntryPrice * prevPosition.quantity +
              quantity * price) /
            (prevPosition.quantity + quantity);

          prevPosition.quantity += quantity;
        } else {
          // pnl happneed

          if (quantity <= prevPosition.quantity) {
            let pnl =
              quantity *
              (price - prevPosition.averageEntryPrice) *
              (curSide == "long" ? 1 : -1);

            usersPnl[longUserId] ??= 0;
            usersPnl[longUserId] += pnl;

            prevPosition.quantity -= quantity;

            //
            updatedPositions[shortUserId] = prevPosition;

            if (prevPosition.quantity == 0) delete this.positions[longUserId];
          } else {
            //todo
          }
        }
      } else {
        this.positions[longUserId] = {
          averageEntryPrice: price,
          margin: longOrderMargin / longOrderQty,
          quantity: quantity,
          side: "long",
          symbol: "BTC-PERP",
          liquidationPrice: 0, // todo
        };
      }

      // update short user
      if (this.positions[shortUserId]) {
        // todo
        let curSide = "short";
        let prevPosition = this.positions[shortUserId];

        if (prevPosition.side == curSide) {
          // means just add positoins
          prevPosition.margin += shortOrderMargin / longOrderQty;
          prevPosition.averageEntryPrice =
            (prevPosition.averageEntryPrice * prevPosition.quantity +
              quantity * price) /
            (prevPosition.quantity + quantity);

          prevPosition.quantity += quantity;
        } else {
          // pnl happneed

          if (quantity <= prevPosition.quantity) {
            let pnl =
              quantity *
              (price - prevPosition.averageEntryPrice) *
              (curSide == "long" ? 1 : -1);

            usersPnl[shortUserId] ??= 0;
            usersPnl[shortUserId] += pnl;

            prevPosition.quantity -= quantity;
            updatedPositions[shortUserId] = prevPosition;

            if (prevPosition.quantity == 0) delete this.positions[shortUserId];
          } else {
            //todo
          }
        }
      } else {
        this.positions[shortUserId] = {
          averageEntryPrice: price,
          margin: shortOrderMargin / longOrderQty,
          quantity: quantity,
          side: "short",
          symbol: "BTC-PERP",
          liquidationPrice: 0, // todo
        };
      }
    });

    return { usersPnl, updatedPositions };
  }
}
