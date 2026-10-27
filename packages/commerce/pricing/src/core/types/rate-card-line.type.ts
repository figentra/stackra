/**
 * Stackra file contract:
 * Purpose: `RateCardLine`, one metered rate of a rate card: the meter (AI credits, messages to a country, KYC checks,
 *          sync runs, automation runs) and its price per unit, to six decimals.
 * Boundary: a type only; `rate-card:<name>` data.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decision 1); config-model section 2.
 */
import type { UnitPrice } from "@stackra/money";

/** One rate on a rate card. */
export interface RateCardLine {
  /** The meter key (`messaging.whatsapp.eg`). */
  readonly meter: string;

  /** The price of one unit. */
  readonly unitPrice: UnitPrice;
}
