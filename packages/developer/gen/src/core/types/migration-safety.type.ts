/**
 * Stackra file contract:
 * Purpose: `MigrationSafety`, what gen writes to `.stackra/migration-safety.json` beside a service's compiled
 *          migrations: each migration in apply order with its ADR 0159 class, whether it is destructive, the compiled
 *          step files it became and every statement above `additive` with its reason. `stackra.migration-safety/v1`,
 *          the contract `runway evidence` reads to fill the deploy evidence's `destructive` (ADR 0533).
 * Boundary: data only; written by `emitMigrationSafety` from `classifyMigrations`.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decision 3; the 2026-10-23 note); ADR 0533 (decision 3: gen's migration
 *                     classification is the destructive floor's evidence).
 */
import type { MigrationSafetyRow } from "#core/types/migration-safety-row.type";

/** The classified migrations of one member. */
export interface MigrationSafety {
  /** The contract version `runway evidence` reads. */
  readonly schema: "stackra.migration-safety/v1";

  /** Every migration, in apply order. */
  readonly migrations: readonly MigrationSafetyRow[];
}
