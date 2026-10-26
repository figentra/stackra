/**
 * Stackra file contract:
 * Purpose: `OfferStack`, what `stackOffers` answers for a requested set of offers: the offers that apply together
 *          and the offers the stacking rule refused.
 * Boundary: a type only. A refused offer is reported, never dropped silently, so checkout can say why.
 * Runtime: isomorphic
 * Governing contract: ADR 0393 (decision 4); owner M3-6.
 */
import type { CatalogueOffer } from "#core/types/catalogue-offer.type";

/** A stacking answer. */
export interface OfferStack {
  /** The offers that apply, in the order requested. */
  readonly applied: readonly CatalogueOffer[];

  /** The offers refused because they do not stack with the applied ones. */
  readonly refused: readonly CatalogueOffer[];
}
