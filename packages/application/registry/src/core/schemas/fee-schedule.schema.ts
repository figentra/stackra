/**
 * Stackra file contract:
 * Purpose: `FeeSchedule`, a partner fee schedule as a catalogue record: the share Figentra keeps of a partner app's
 *          revenue, in basis points plus a fixed fee, in one currency, from a date.
 * Boundary: a shape class; registers this package's schema for itself when the module loads. Every value is data in
 *           the product's admin (`fee-schedule:<name>`); `computePartnerPayout` applies one.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decision 8); config-model section 2.
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";

import { FEE_SCHEDULE_SCHEMA } from "#core/constants/fee-schedule-schema.constant";

/**
 * One fee schedule.
 *
 * @example
 * validate(FeeSchedule, { key: "partner-standard", currency: "SAR", basisPoints: 2000, effectiveFrom: "2026-11-01" });
 */
export class FeeSchedule extends Schema {
  /** The rate, in basis points of the gross. */
  @Int
  basisPoints!: number;

  /** The fixed fee per period, in minor units. */
  @Int
  fixedMinor = 0;

  /** The schedule's key (`partner-standard`). */
  key!: string;

  /** The ISO 4217 currency its fixed fee is in. */
  currency!: string;

  /** The ISO date it applies from. */
  effectiveFrom!: string;
}

registerSchemas([[FeeSchedule, FEE_SCHEDULE_SCHEMA]]);
