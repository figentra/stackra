/**
 * Stackra file contract:
 * Purpose: `emitMigrations`, the migration target: one `.stackra/migrations/<seq>_<module>_<NNNN>_<stem>.up.sql` per
 *          compiled step, in the order `orderMigrations` gives, with its `.down.sql` inverse when the step has one. A
 *          migration of several steps numbers them `_1`, `_2`, … so the runner reverts them as one batch. A step the
 *          runner must not wrap in a transaction opens with `-- stackra:transactional=false`.
 * Boundary: pure: ordered units in, files out. The sequence is global and dense from 0001, so the file names change
 *           when a migration is inserted before others; that only happens before the migration is applied anywhere
 *           (ADR 0159: an applied migration is frozen). `readMigrationFiles` (@stackra/database/node) reads this layout.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decision 2 as amended 2026-10-24: the `N_name.up.sql` numbering and the
 *                     non-transactional header).
 */
import { GENERATED_NOTICE } from "#core/constants/generated-notice.constant";
import { MIGRATIONS_DIR } from "#core/constants/migrations-dir.constant";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MigrationUnit } from "#core/types/migration-unit.type";

/** The header the runner reads to apply a step outside a transaction. */
const NON_TRANSACTIONAL = "-- stackra:transactional=false";

/** The SQL text of a list of statements, each ended by `;`. */
const body = (statements: readonly string[]): string =>
  statements.map((statement) => `${statement};\n`).join("");

/**
 * The SQL files of `ordered`.
 *
 * @example
 * emitMigrations(orderMigrations(units).ordered)[0]?.path;
 * // ".stackra/migrations/0001_search_0001_create_text_functions.up.sql"
 */
export function emitMigrations(ordered: readonly MigrationUnit[]): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  let sequence = 0;
  for (const unit of ordered) {
    const stem = unit.id.replace(".", "_");
    for (const [index, step] of unit.steps.entries()) {
      sequence += 1;
      const name = `${String(sequence).padStart(4, "0")}_${stem}${unit.steps.length > 1 ? `_${index + 1}` : ""}`;
      const notice = `-- ${GENERATED_NOTICE}; from ${unit.id} (${unit.file})\n`;
      const header = step.transactional ? notice : `${NON_TRANSACTIONAL}\n${notice}`;
      files.push({ path: `${MIGRATIONS_DIR}/${name}.up.sql`, content: header + body(step.sql) });
      if (step.inverse !== false)
        files.push({
          path: `${MIGRATIONS_DIR}/${name}.down.sql`,
          content: header + body(step.inverse),
        });
    }
  }
  return files;
}
