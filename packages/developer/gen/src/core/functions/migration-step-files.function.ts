/**
 * Stackra file contract:
 * Purpose: `migrationStepFiles(unit)`, the SQL files of one compiled migration, one per step: the step's name
 *          (`<module>_<NNNN>_<stem>`, `_1`, `_2`, … when it has several steps), its `.up.sql` content and, when the step
 *          has an inverse, its `.down.sql` content. A step the runner must not wrap in a transaction opens with
 *          `-- stackra:transactional=false`. Both a service's stream (`emitMigrations`, which adds the sequence) and a
 *          package's committed SQL (`emitPackageMigrations`) are built from it, so the two hold the same bytes.
 * Boundary: pure: one unit in, its step files out; no folder and no sequence number.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decision 2 as amended 2026-10-24: the `N_name.up.sql` numbering and the
 *                     non-transactional header); STA-2788.
 */
import { GENERATED_NOTICE } from "#core/constants/generated-notice.constant";
import type { MigrationUnit } from "#core/types/migration-unit.type";

/** The header the runner reads to apply a step outside a transaction. */
const NON_TRANSACTIONAL = "-- stackra:transactional=false";

/** The SQL text of a list of statements, each ended by `;`. */
const body = (statements: readonly string[]): string =>
  statements.map((statement) => `${statement};\n`).join("");

/**
 * The step files of `unit`.
 *
 * @param unit - one compiled migration.
 * @example
 * migrationStepFiles(unit)[0]?.name; // "search_0001_create_text_functions"
 */
export function migrationStepFiles(
  unit: MigrationUnit,
): { readonly name: string; readonly up: string; readonly down?: string }[] {
  const stem = unit.id.replace(".", "_");
  const notice = `-- ${GENERATED_NOTICE}; from ${unit.id} (${unit.file})\n`;
  return unit.steps.map((step, index) => {
    const header = step.transactional ? notice : `${NON_TRANSACTIONAL}\n${notice}`;
    return {
      name: `${stem}${unit.steps.length > 1 ? `_${index + 1}` : ""}`,
      up: header + body(step.sql),
      ...(step.inverse === false ? {} : { down: header + body(step.inverse) }),
    };
  });
}
