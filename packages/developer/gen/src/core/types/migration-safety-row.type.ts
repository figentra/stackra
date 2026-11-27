/**
 * Stackra file contract:
 * Purpose: `MigrationSafetyRow`, one classified migration of `stackra.migration-safety/v1`: its id, owner and source
 *          file, its ADR 0159 class (the highest of its statements), whether it is destructive, the compiled step files
 *          it became, and every statement above `additive`.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decision 3; the 2026-10-23 note); ADR 0533 (decision 3).
 */
import type { MigrationSafetyClass } from "#core/types/migration-safety-class.type";
import type { MigrationSafetyFinding } from "#core/types/migration-safety-finding.type";
import type { MigrationUnit } from "#core/types/migration-unit.type";

/** One classified migration. */
export interface MigrationSafetyRow {
  /** The migration id, `<module>.<NNNN>_<snake stem>`. */
  readonly id: string;

  /** Whose it is. */
  readonly owner: MigrationUnit["owner"];

  /** The file it was compiled from. */
  readonly file: string;

  /** The highest class of its statements. */
  readonly class: MigrationSafetyClass;

  /** Whether the class is `contract` or `banned`. */
  readonly destructive: boolean;

  /** The compiled step files it became, without `.up.sql` (`0007_outbox_0006_contract_outbox_tenancy_1`). */
  readonly files: readonly string[];

  /** Every statement above `additive`, in order. */
  readonly findings: readonly MigrationSafetyFinding[];
}
