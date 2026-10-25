/**
 * Stackra file contract:
 * Purpose: `FEE_SCHEDULE_SCHEMA`, the shipped zod schema of `FeeSchedule`: its key, the currency, the rate in basis
 *          points, the fixed fee in minor units, and the date it applies from.
 * Boundary: internal; `fee-schedule.schema.ts` registers it. Every number is a whole number; a rate is 0 to 10,000
 *           basis points.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decision 8: fee-schedule records); config-model section 2 (`fee-schedule:<name>`).
 */
import { z } from "zod";

/** The shipped `FeeSchedule$`. */
export const FEE_SCHEDULE_SCHEMA = z.object({
  key: z.string().min(1),
  currency: z.string().regex(/^[A-Z]{3}$/, "must be an ISO 4217 code"),
  basisPoints: z.int().min(0).max(10_000),
  fixedMinor: z.int().min(0).default(0),
  effectiveFrom: z.iso.date(),
});
