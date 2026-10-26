/**
 * Stackra file contract:
 * Purpose: `offerEligible`, whether an applicant may take an offer: the offer runs in the applicant's pack and
 *          product, its rule set (if any) matched the applicant, and the pack's redemption cap is not used up.
 * Boundary: pure. The rule-set answer comes from the caller's `@stackra/rules` `decide` over the offer's
 *           `eligibility.ruleSet`; a caller with no rule set passes `true`. Nothing here names a pack or a product.
 * Runtime: isomorphic
 * Governing contract: ADR 0393 (decisions 2 and 3); owner M3-6, RV-52.
 */
import type { CatalogueOffer } from "#core/types/catalogue-offer.type";

/**
 * Whether `context`'s applicant may take `offer`.
 *
 * @example
 * offerEligible(startup, { pack: "eg", product: "commerce", ruleSetMatched: decision.matched, redeemedInPack: 12 });
 */
export function offerEligible(
  offer: CatalogueOffer,
  context: {
    readonly pack: string;
    readonly product: string;
    readonly ruleSetMatched: boolean;
    readonly redeemedInPack: number;
  },
): boolean {
  const { packs, products, ruleSet, capPerPack } = offer.eligibility;
  if (!packs.includes(context.pack) || !products.includes(context.product)) return false;
  if (ruleSet !== null && !context.ruleSetMatched) return false;
  const cap = Object.hasOwn(capPerPack, context.pack) ? capPerPack[context.pack] : undefined;
  return cap === undefined || context.redeemedInPack < cap;
}
