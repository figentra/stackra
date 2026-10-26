/**
 * Stackra file contract:
 * Purpose: `OfferBenefitKind`, what one benefit of an offer gives: a percentage off the regional price, a grant of
 *          credits, a free migration, or a module at no charge.
 * Boundary: an `Enum.of` value plus the type of the same name. The four kinds are M3-6; which offer gives what, and
 *           how much, is `offer:<name>` data.
 * Runtime: isomorphic
 * Governing contract: ADR 0393 (decision 2); owner M3-6, R3-SO-18.
 */
import { Enum } from "@stackra/contracts";

/** The kinds of an offer benefit. */
export const OfferBenefitKind = Enum.of({
  /** A percentage off the regional price list, in basis points. */
  Percent: "percent",
  /** Credits of one kind (AI, messaging) granted per period. */
  CreditGrant: "credit_grant",
  /** The migration service at no charge. */
  FreeMigration: "free_migration",
  /** One paid module at no charge. */
  ModuleGrant: "module_grant",
});

/** One of the codes above. */
export type OfferBenefitKind = Enum.Value<typeof OfferBenefitKind>;
