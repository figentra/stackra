/**
 * Stackra file contract:
 * Purpose: `ResolvedPrice`, what `resolvePrice` answers: the total, the unit price where there is one, the kind, the
 *          lists it came from (the applied list first, its base after) and the rate snapshots a formula used.
 * Boundary: a type only. A document priced offline stores it whole, so the server re-evaluates against the same
 *           sources and records a difference as a review item (ADR 0337 decision 4).
 * Runtime: isomorphic
 * Governing contract: ADR 0337 (decisions 3 and 4); ADR 0220 (decision 3).
 */
import type { Money } from "@stackra/money";
import type { RateSnapshot } from "@stackra/money/contracts";

import type { PriceKind } from "#core/enums/price-kind.enum";
import type { PriceSource } from "#core/types/price-source.type";

/** A priced item. */
export interface ResolvedPrice {
  /** The charge for the whole quantity. */
  readonly total: Money;

  /** The price of one unit; null for a graduated price, which has no single unit price. */
  readonly unitPrice: Money | null;

  /** How the price was stated. */
  readonly kind: PriceKind;

  /** The applied list first, then the base lists it derived from. */
  readonly sources: readonly PriceSource[];

  /** The rate snapshots a formula priced with; empty otherwise. */
  readonly rates: readonly RateSnapshot[];
}
