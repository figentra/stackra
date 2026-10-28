/**
 * Stackra file contract:
 * Purpose: `CohortResult`, a sized cohort: the distinct people in it per period.
 * Boundary: a type only; counts of people, never who they are (membership lists are personal data and stay in the
 *           store).
 * Runtime: isomorphic
 * Governing contract: ADR 0163 (decision 5 as amended 2026-10-28); ADR 0294 (decision 15: the leaf entry).
 */
import type { RetentionPeriod } from "#contracts/enums/retention-period.enum";
import type { CohortBucket } from "#contracts/types/cohort-bucket.type";

/** A sized cohort. */
export interface CohortResult {
  /** The period the buckets are in. */
  readonly period: RetentionPeriod;

  /** The buckets, oldest first. */
  readonly buckets: readonly CohortBucket[];
}
