/**
 * Stackra file contract:
 * Purpose: `PartnerPayout`, one period's payout to a partner for one app: the gross the tenants paid on their one
 *          invoice, the fee kept under the named schedule, and the net paid out.
 * Boundary: a shape class; registers this package's schema for itself when the module loads. The billing engine
 *           collects; the registry carries the record; `computePartnerPayout` fills the amounts.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decisions 7 and 8: one bill, partner payout records).
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";

import { PARTNER_PAYOUT_SCHEMA } from "#core/constants/partner-payout-schema.constant";

/**
 * One partner payout.
 *
 * @example
 * validate(PartnerPayout, { partner: "org_7", app: "acme.loyalty", period: "2026-11", currency: "SAR",
 *   grossMinor: 10_000, feeMinor: 2_000, netMinor: 8_000, schedule: "partner-standard" });
 */
export class PartnerPayout extends Schema {
  /** What tenants paid, in minor units. */
  @Int
  grossMinor!: number;

  /** What Figentra kept, in minor units. */
  @Int
  feeMinor!: number;

  /** What the partner is paid, in minor units. */
  @Int
  netMinor!: number;

  /** The partner organisation's id. */
  partner!: string;

  /** The app's listing key. */
  app!: string;

  /** The month, `YYYY-MM`. */
  period!: string;

  /** The ISO 4217 currency. */
  currency!: string;

  /** The key of the fee schedule applied. */
  schedule!: string;
}

registerSchemas([[PartnerPayout, PARTNER_PAYOUT_SCHEMA]]);
