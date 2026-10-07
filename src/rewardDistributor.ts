import { MonetizationEvent } from './types.js';

export class RewardDistributor {
  private readonly transactions: MonetizationEvent[] = [];

  recordEvent(event: MonetizationEvent): void {
    this.transactions.push(event);
  }

  getEvents(): MonetizationEvent[] {
    return [...this.transactions];
  }

  getEventsByType(type: MonetizationEvent['type']): MonetizationEvent[] {
    return this.transactions.filter((e) => e.type === type);
  }

  getTotalAmount(): number {
    return this.transactions.reduce((sum, e) => sum + e.amount, 0);
  }

  clear(): void {
    this.transactions.length = 0;
  }
}
