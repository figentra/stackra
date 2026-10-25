/**
 * Stackra file contract:
 * Purpose: `PriceQuery`, what `resolvePrice` prices: an item and its quantity, in a currency, on a channel in a Market,
 *          at an instant, with the item's fields a formula reads and the rate snapshots kept with the cart.
 * Boundary: a type only; every input is an argument (ADR 0337 decision 2), so the same query prices the same on a till
 *           and on the server.
 * Runtime: isomorphic
 * Governing contract: ADR 0337 (decisions 2 and 3); ADR 0244 (decision 3 and the STA-451 note); ADR 0220 (decision 3).
 */
import type { RateSnapshot } from "@stackra/money/contracts";

/** An item to price. */
export interface PriceQuery {
  /** The catalogue item. */
  readonly itemId: string;

  /** How many: a positive number (a weighed item may be fractional; graduated prices need whole units). */
  readonly quantity: number;

  /** ISO 4217 currency to price in. */
  readonly currency: string;

  /** The Market the order resolved to, or null. */
  readonly market: string | null;

  /** The sales channel the order came from, or null. */
  readonly channel: string | null;

  /** When the price applies. */
  readonly at: Date;

  /** The item's fields a formula reads (`{ weight_grams: 12.5, purity: "0.875" }`). */
  readonly inputs: Readonly<Record<string, number | string>>;

  /** The rate snapshots the cart or quote holds. */
  readonly rates: readonly RateSnapshot[];
}
