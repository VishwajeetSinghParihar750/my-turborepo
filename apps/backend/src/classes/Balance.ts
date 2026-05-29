type BALANCE_INFO = {
  userId: string;
  availableBalance: number;
};

export default class Balance {
  balance: Record<string, BALANCE_INFO> = {};
  pnl: Record<string, BALANCE_INFO> = {};

  reset() {
    this.balance = {};
  }

  addBalance(userId: string, amount: number) {
    this.balance[userId] ??= { userId, availableBalance: 0 };
    this.balance[userId].availableBalance += amount;
  }

  getBalance(userId: string) {
    return this.balance[userId]!.availableBalance;
  }
  applyUsersPnl(pnl: Record<string, number>) {
    Object.entries(pnl).forEach(([id, balUpdate]) => {
      this.pnl[id] ??= { availableBalance: 0, userId: id };
      this.pnl[id].availableBalance += balUpdate;
    });
  }
  getRealizedPnl(userId: string) {
    return this.pnl[userId];
  }
}
