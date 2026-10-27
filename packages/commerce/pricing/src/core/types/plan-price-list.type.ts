/**
 * Stackra file contract:
 * Purpose: `PlanPriceList`, the plan prices of one regional price tier in one price currency: one entry of a
 *          `price-list:<product>` record, keyed by (regional tier, price currency).
 * Boundary: a type only; price-list data. The regional tier of a billing country and its price and collection
 *           currencies are market-pack values (`BILLING_PACK_KEYS`); this list never names a country.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decision 1); ADR 0392 (decision 1); owner OS-66, R3-SO-14.
 */
import type { CurrencyCode } from "@stackra/money";

import type { PlanPrice } from "#core/types/plan-price.type";

/** One regional price list. */
export interface PlanPriceList {
  /** The list's key, `priceListKey(regionalTier, currency)`. */
  readonly key: string;

  /** The regional price tier (`low`). */
  readonly regionalTier: string;

  /** The price currency of every price. */
  readonly currency: CurrencyCode;

  /** The plan prices on this list. */
  readonly prices: readonly PlanPrice[];
}
