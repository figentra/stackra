/**
 * Stackra file contract:
 * Purpose: `CatalogueOffer`, one parsed `offer:<name>` version: its key, its benefits and its eligibility.
 * Boundary: a type only; `offerOf` builds it. Whether it stacks with another offer is `rule-set:os:offer-stacking`'s
 *           answer, never a field here.
 * Runtime: isomorphic
 * Governing contract: ADR 0393 (decision 2); owner M3-6.
 */
import type { OfferBenefit } from "#core/types/offer-benefit.type";
import type { OfferEligibility } from "#core/types/offer-eligibility.type";

/** One offer in the catalogue. */
export interface CatalogueOffer {
  /** The record key (`offer:startup`). */
  readonly key: string;

  /** What it gives. */
  readonly benefits: readonly OfferBenefit[];

  /** Who may take it. */
  readonly eligibility: OfferEligibility;
}
