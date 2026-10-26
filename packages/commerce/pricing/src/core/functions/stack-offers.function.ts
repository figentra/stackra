/**
 * Stackra file contract:
 * Purpose: `stackOffers`, which of several requested offers apply together: every offer the stacking rule set says
 *          stacks, plus the single best of the rest (the largest total percentage; the first requested on a tie); the
 *          others are refused.
 * Boundary: pure. Whether an offer stacks is `rule-set:os:offer-stacking`'s answer, evaluated by the caller with
 *           `@stackra/rules`' `decide` and passed in as `stacks`; the seeded rule lets the annual discount stack and
 *           nothing else (M3-6), and the admin edits that rule, never this code.
 * Runtime: isomorphic
 * Governing contract: ADR 0393 (decision 4); owner M3-6.
 */
import { OfferBenefitKind } from "#core/enums/offer-benefit-kind.enum";
import type { CatalogueOffer } from "#core/types/catalogue-offer.type";
import type { OfferStack } from "#core/types/offer-stack.type";

/** The offer's total percentage, in basis points. */
function percentOf(offer: CatalogueOffer): number {
  let total = 0;
  for (const benefit of offer.benefits)
    if (benefit.kind === OfferBenefitKind.Percent) total += benefit.basisPoints;
  return total;
}

/**
 * The offers of `requested` that apply together.
 *
 * @example
 * const stack = stackOffers([founding, startup, annual], (offer) => decide(STACKING, rule, { "offer.key": offer.key }, options).matched);
 * if (stack.refused.length > 0) refuse(stack.refused);
 */
export function stackOffers(
  requested: readonly CatalogueOffer[],
  stacks: (offer: CatalogueOffer) => boolean,
): OfferStack {
  let best: CatalogueOffer | undefined;
  for (const offer of requested)
    if (!stacks(offer) && (best === undefined || percentOf(offer) > percentOf(best))) best = offer;
  const applied = requested.filter((offer) => offer === best || stacks(offer));
  const refused = requested.filter((offer) => !applied.includes(offer));
  return Object.freeze({ applied: Object.freeze(applied), refused: Object.freeze(refused) });
}
