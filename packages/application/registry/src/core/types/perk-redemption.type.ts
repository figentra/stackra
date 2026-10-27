/**
 * Stackra file contract:
 * Purpose: `PerkRedemption`, what one redemption gives: the code to show, the link to follow, or the lead sent to the
 *          partner (only the listing's fields, after the tenant admin consented).
 * Boundary: a type only; `redeemPerk` builds it. A lead holds the admin's contact details: OS logs the consent and
 *           sends it through the perk-redemption workflow, never from here.
 * Runtime: isomorphic
 * Governing contract: ADR 0393 (decision 1); owner M3-7, US-62.
 */
import type { PerkRedemptionKind } from "#core/enums/perk-redemption-kind.enum";

/** What one perk redemption gives: a code, a link or a lead sent to the partner. */
export type PerkRedemption =
  | { readonly kind: typeof PerkRedemptionKind.Code; readonly code: string }
  | { readonly kind: typeof PerkRedemptionKind.Link; readonly url: string }
  | {
      readonly kind: typeof PerkRedemptionKind.Lead;
      readonly lead: Readonly<Record<string, string>>;
    };
