/**
 * Stackra file contract:
 * Purpose: `MigrationSafetyFinding`, one statement of a classified migration above `additive`: where it is (step and
 *          statement, 1-based), its ADR 0159 class, why, and the start of its SQL.
 * Boundary: a type only; part of `stackra.migration-safety/v1`.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decision 3; the 2026-10-23 note).
 */
import type { MigrationSafetyClass } from "#core/types/migration-safety-class.type";

/** One statement above `additive`. */
export interface MigrationSafetyFinding {
  /** The 1-based step of the migration. */
  readonly step: number;

  /** The 1-based statement of the step. */
  readonly statement: number;

  /** The statement's ADR 0159 class, never `additive`. */
  readonly class: Exclude<MigrationSafetyClass, "additive">;

  /** Why, in one line. */
  readonly reason: string;

  /** The statement's start, its comment lines dropped and whitespace folded, at most 120 characters. */
  readonly sql: string;
}
