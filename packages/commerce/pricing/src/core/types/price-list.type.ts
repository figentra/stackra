/**
 * Stackra file contract:
 * Purpose: `PriceList`, a dated list of item prices in one currency, scoped to a Market, a sales channel (a delivery
 *          app, the storefront, the till) or both, explicit or derived from a base list.
 * Boundary: a type only; the replica a till prices from offline, so it carries its `revision` (ADR 0337 decision 3).
 *           A null market or channel matches any. Which lists exist is tenant data in OS pricing.
 * Runtime: isomorphic
 * Governing contract: ADR 0244 (decisions 1, 2 and 6, and the STA-451 note: an order resolves to channel and Market);
 *                     the RES-44 and RES-169 answers (one list per channel).
 */
import type { CurrencyCode } from "@stackra/money";

import type { ItemPrice } from "#core/types/item-price.type";
import type { PriceAdjustment } from "#core/types/price-adjustment.type";

/** A price list. */
export interface PriceList {
  /** The list's id. */
  readonly id: string;

  /** The replica revision the list was read at. */
  readonly revision: string;

  /** The currency of every price. */
  readonly currency: CurrencyCode;

  /** The Market it applies in; null for every Market. */
  readonly market: string | null;

  /** The sales channel it applies on; null for every channel. */
  readonly channel: string | null;

  /** First instant it applies; null for always. */
  readonly validFrom: Date | null;

  /** First instant it no longer applies; null for open-ended. */
  readonly validTo: Date | null;

  /** Explicit prices; on a derived list they override the base. */
  readonly prices: readonly ItemPrice[];

  /** How the list derives from a base list; null for an explicit list. */
  readonly adjustment: PriceAdjustment | null;
}
