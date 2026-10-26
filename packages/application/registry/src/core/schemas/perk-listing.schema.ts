/**
 * Stackra file contract:
 * Purpose: `PerkListing`, a partner perk in the app market as a catalogue record: role `perk`, never installed,
 *          redeemed by code, link or lead, listed for chosen packs and products, with the fee schedule of its listing
 *          fee.
 * Boundary: a shape class; registers this package's schema for itself when the module loads. Every value is data in
 *           the OS admin; `perkEligible`, `redeemPerk` and `perkListingFee` read one.
 * Runtime: isomorphic
 * Governing contract: ADR 0393 (decision 1); owner M3-7, R3-SO-18.
 */
import { registerSchemas, Schema } from "@stackra/validation";

import { PERK_LISTING_SCHEMA } from "#core/constants/perk-listing-schema.constant";
import type { PerkRedemptionKind } from "#core/enums/perk-redemption-kind.enum";
import type { ReviewState } from "#core/enums/review-state.enum";

/**
 * One perk listing.
 *
 * @example
 * validate(PerkListing, { key: "perk-shipping", partner: "dev_01…", state: "approved", redemption: "code", code: "WELCOME", packs: ["ae"], products: ["commerce"], termsUrl: "https://partner.example/terms" });
 */
export class PerkListing extends Schema {
  /** The listing key. */
  key!: string;

  /** The partner's developer tenant id; the listing fee is invoiced to it. */
  partner!: string;

  /** The listing's review state; only `approved` is shown. */
  state!: ReviewState;

  /** How it is redeemed. */
  redemption!: PerkRedemptionKind;

  /** The code shown, for a code perk. */
  code: string | null = null;

  /** The link followed, for a link perk. */
  url: string | null = null;

  /** The tenant fields sent to the partner, for a lead perk. */
  leadFields: string[] = [];

  /** Market pack codes it is listed in. */
  packs!: string[];

  /** Product keys it is listed in. */
  products!: string[];

  /** The partner's terms. */
  termsUrl!: string;

  /** The key of the fee schedule its listing fee is invoiced under; null for a free listing. */
  feeSchedule: string | null = null;
}

registerSchemas([[PerkListing, PERK_LISTING_SCHEMA]]);
