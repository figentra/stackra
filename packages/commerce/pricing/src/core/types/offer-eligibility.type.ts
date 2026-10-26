/**
 * Stackra file contract:
 * Purpose: `OfferEligibility`, who may take an offer: the market packs and products it runs in, the rule set that
 *          decides an applicant (`rule-set:os:startup-perk-eligibility`), and a cap on redemptions per pack.
 * Boundary: a type only; `offer:<name>` data. The rule set is evaluated by the caller with `@stackra/rules`' `decide`
 *           over the applicant's facts (the verification record's incorporation date, the editable incubator list);
 *           `offerEligible` takes its answer.
 * Runtime: isomorphic
 * Governing contract: ADR 0393 (decisions 2 and 3); owner M3-6, RV-52.
 */

/** An offer's eligibility. */
export interface OfferEligibility {
  /** Market pack codes it runs in. */
  readonly packs: readonly string[];

  /** Product keys it runs in. */
  readonly products: readonly string[];

  /** The rule-set key deciding an applicant; null when every applicant in the packs and products qualifies. */
  readonly ruleSet: string | null;

  /** Pack code to the most redemptions there; a pack absent here is uncapped. */
  readonly capPerPack: Readonly<Record<string, number>>;
}
