import type { POSITION } from "../types";

export default class LiquidationEngine {
  fund: number = 0;

  liquidationPrices: Record<string, number> = {};
  // positions :
  handleUpdatedPositions(updatedPositions: Record<string, POSITION>) {
    //todo
    // update liquidation prices
  }
}
