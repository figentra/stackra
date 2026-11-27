/**
 * Stackra file contract:
 * Purpose: `migrationStepNames`, the compiled file name of every step of `ordered`, without `.up.sql`: a sequence
 *          global and dense from `0001`, the migration id with its dot as `_`, and `_1`, `_2`, … when a migration has
 *          several steps (`0007_outbox_0006_contract_outbox_tenancy_2`). `emitMigrations` names its files with it and
 *          `classifyMigrations` records them, so the safety file and the SQL files always agree.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decision 2 as amended 2026-10-24: the `N_name.up.sql` numbering).
 */
import type { MigrationUnit } from "#core/types/migration-unit.type";

/**
 * The step file names of each unit, in the order given.
 *
 * @example
 * migrationStepNames([search0001])[0]; // ["0001_search_0001_create_text_functions"]
 */
export function migrationStepNames(ordered: readonly MigrationUnit[]): string[][] {
  let sequence = 0;
  return ordered.map((unit) => {
    const stem = unit.id.replace(".", "_");
    return unit.steps.map((_, index) => {
      sequence += 1;
      return `${String(sequence).padStart(4, "0")}_${stem}${unit.steps.length > 1 ? `_${index + 1}` : ""}`;
    });
  });
}
