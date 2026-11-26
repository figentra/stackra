/**
 * Stackra file contract:
 * Purpose: `RateQuote`, one priced service a carrier offers for a `RateRequest`: its code, its name, the price, the
 *          carrier's transit estimate and, through an aggregator, the carrier that delivers.
 * Boundary: a type in the leaf entry. The price is what the carrier charges the account on the connection; any markup
 *           or free-shipping outcome is the consumer's rule set.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decision 2).
 */
import type { Money } from "@stackra/money";

import type { Incoterm } from "#contracts/enums/incoterm.enum";

/**
 * One offered service.
 *
 * @example
 * const cheapest = quotes.reduce((a, b) => (b.amount.minor < a.amount.minor ? b : a));
 */
export interface RateQuote {
  /** The carrier's service code, passed back in `LabelRequest.service`. */
  readonly service: string;

  /** The service's display name from the carrier. */
  readonly name: string;

  /** What the carrier charges. */
  readonly amount: Money;

  /** The carrier's estimate in whole days, fastest and slowest, when it gives one. */
  readonly transitDays?: { readonly min: number; readonly max: number };

  /** When the quoted price stops being honoured (ISO 8601), when the carrier says. */
  readonly expiresAt?: string;

  /**
   * The carrier that delivers, when the connection is an aggregator quoting many (`smsa`): a known provider code, else
   * the aggregator's name for it. The connection's own `provider` stays the aggregator's. Left out by a direct carrier.
   */
  readonly carrier?: string;

  /** The terms the price is for, when the carrier quoted a cross-border shipment: DDP includes the duties. */
  readonly incoterm?: Incoterm;
}
