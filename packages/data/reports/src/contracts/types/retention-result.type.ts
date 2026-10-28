/**
 * Stackra file contract:
 * Purpose: `RetentionResult`, a computed retention table: one row per cohort with its size and the people retained in
 *          each period after the start.
 * Boundary: a type only; counts of people, never who they are.
 * Runtime: isomorphic
 * Governing contract: ADR 0163 (decision 5 as amended 2026-10-28); ADR 0294 (decision 15: the leaf entry).
 */
import type { RetentionPeriod } from "#contracts/enums/retention-period.enum";
import type { RetentionCohortRow } from "#contracts/types/retention-cohort-row.type";

/** A computed retention table. */
export interface RetentionResult {
  /** The period the table is in. */
  readonly period: RetentionPeriod;

  /** The cohorts, oldest first. */
  readonly cohorts: readonly RetentionCohortRow[];
}
