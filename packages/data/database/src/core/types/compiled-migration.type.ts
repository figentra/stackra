/**
 * Stackra file contract:
 * Purpose: `CompiledMigration`, what `compileMigration` returns for one migration class: its `after` edges and its
 *          ordered steps.
 * Boundary: data; gen orders the members' compiled migrations, numbers the files and locks each step's hash.
 * Runtime: node
 * Governing contract: ADR 0159 as amended by ADR 0305.
 */
import type { CompiledStep } from "#core/types/compiled-step.type";
import type { MigrationId } from "#core/types/migration-id.type";

/** One compiled migration. */
export interface CompiledMigration {
  /** The migrations of other members it declared it needs first. */
  readonly after: readonly MigrationId[];

  /** The steps, in the order the runner applies them: the transactional step first, then each online step. */
  readonly steps: readonly CompiledStep[];
}
