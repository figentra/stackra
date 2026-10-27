/**
 * Stackra file contract:
 * Purpose: `OfferBenefit`, one benefit of an offer, by kind: a percentage in basis points, a credit grant (credit
 *          kind, units per period), a free migration, or a module grant; each but the migration runs for a number of
 *          months from the subscription start, or for as long as the offer holds when `months` is null.
 * Boundary: a type only; `offer:<name>` data read by `offerOf`.
 * Runtime: isomorphic
 * Governing contract: ADR 0393 (decision 2); owner M3-6, RV-52.
 */
import type { BillingPeriod } from "#core/enums/billing-period.enum";
import type { OfferBenefitKind } from "#core/enums/offer-benefit-kind.enum";

/** One benefit an offer grants. */
export type OfferBenefit =
  | {
      readonly kind: typeof OfferBenefitKind.Percent;
      /** 1 to 10,000 basis points off the price. */
      readonly basisPoints: number;
      /** Months it lasts; null while the offer holds. */
      readonly months: number | null;
    }
  | {
      readonly kind: typeof OfferBenefitKind.CreditGrant;
      /** The credit kind (`ai`, `messaging`). */
      readonly credit: string;
      /** Units granted each period. */
      readonly units: number;
      /** How often the grant repeats. */
      readonly period: BillingPeriod;
      /** Months it lasts; null while the offer holds. */
      readonly months: number | null;
    }
  | { readonly kind: typeof OfferBenefitKind.FreeMigration }
  | {
      readonly kind: typeof OfferBenefitKind.ModuleGrant;
      /** The module entitlement's key. */
      readonly module: string;
      /** Months it lasts; null while the offer holds. */
      readonly months: number | null;
    };
