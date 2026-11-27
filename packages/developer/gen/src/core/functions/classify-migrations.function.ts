/**
 * Stackra file contract:
 * Purpose: `classifyMigrations`, gen's ADR 0159 classification of a member's ordered migrations: every statement of
 *          every compiled step gets its class, each top-level statement of a string alone (`splitSqlStatements`,
 *          then `classifyMigrationStatement` with the tables the migration created before it), each migration the
 *          highest of its statements, `destructive` when that is `contract` or `banned`, plus the step files it
 *          became and every statement above `additive`. A `banned` statement is
 *          refused (`migration_banned`), except in a released migration of `RELEASED_BANNED_MIGRATIONS`, which is
 *          frozen and stays classified `banned`.
 * Boundary: pure: ordered units in, the `stackra.migration-safety/v1` document and the refusals out.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decision 3; the 2026-10-23 note: gen enforces the class of each step); ADR 0334
 *                     (rule 4); ADR 0533 (decision 3: gen's migration classification is the destructive evidence).
 */
import { RELEASED_BANNED_MIGRATIONS } from "#core/constants/released-banned-migrations.constant";
import { classifyMigrationStatement } from "#core/functions/classify-migration-statement.function";
import { migrationSafetyRank } from "#core/functions/migration-safety-rank.function";
import { migrationStepNames } from "#core/functions/migration-step-names.function";
import { splitSqlStatements } from "#core/functions/split-sql-statements.function";
import type { GenError } from "#core/types/gen-error.type";
import type { MigrationSafetyClass } from "#core/types/migration-safety-class.type";
import type { MigrationSafety } from "#core/types/migration-safety.type";
import type { MigrationSafetyFinding } from "#core/types/migration-safety-finding.type";
import type { MigrationUnit } from "#core/types/migration-unit.type";

/** The start of a statement for a finding: no comment lines, whitespace folded, at most 120 characters. */
const excerpt = (sql: string): string => {
  const text = sql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join(" ")
    .replaceAll(/\s+/g, " ")
    .trim();
  return text.length > 120 ? `${text.slice(0, 119)}…` : text;
};

/**
 * Classifies `ordered`, the migrations `orderMigrations` put in apply order.
 *
 * @param ordered - the units in apply order.
 * @param released - the released migration ids whose banned statements are frozen (`RELEASED_BANNED_MIGRATIONS`).
 * @example
 * classifyMigrations(ordered).safety.migrations.find((row) => row.destructive)?.id;
 * // "orders.0004_drop_legacy_note"
 */
export function classifyMigrations(
  ordered: readonly MigrationUnit[],
  released: ReadonlySet<string> = RELEASED_BANNED_MIGRATIONS,
): { readonly safety: MigrationSafety; readonly errors: readonly GenError[] } {
  const names = migrationStepNames(ordered);
  const errors: GenError[] = [];
  const migrations = ordered.map((unit, index) => {
    const created = new Set<string>();
    const findings: MigrationSafetyFinding[] = [];
    let highest: MigrationSafetyClass = "additive";
    for (const [step, compiled] of unit.steps.entries())
      for (const [position, compiledSql] of compiled.sql.entries())
        // `schema.sql()` keeps its string as one operation and Postgres runs every statement in it.
        for (const sql of splitSqlStatements(compiledSql)) {
          const classified = classifyMigrationStatement(sql, created);
          if (classified.creates !== undefined) created.add(classified.creates);
          if (migrationSafetyRank(classified.class) > migrationSafetyRank(highest))
            highest = classified.class;
          if (classified.class === "additive") continue;
          findings.push({
            step: step + 1,
            statement: position + 1,
            class: classified.class,
            reason: classified.reason,
            sql: excerpt(sql),
          });
          if (classified.class === "banned" && !released.has(unit.id))
            errors.push({
              code: "migration_banned",
              file: unit.file,
              line: 0,
              column: 0,
              subject: `${unit.id} step ${step + 1} statement ${position + 1}`,
              message: `${unit.id} ${classified.reason}: ${excerpt(sql)}`,
              fix: "ship the schema change alone: a backfill is a queue job, an index on an existing table is built with concurrently() in its own step, and a lock or rewrite is replaced by expand and contract (ADR 0159 decision 3)",
            });
        }
    return {
      id: unit.id,
      owner: unit.owner,
      file: unit.file,
      class: highest,
      destructive: highest === "contract" || highest === "banned",
      files: names[index] ?? [],
      findings,
    };
  });
  return { safety: { schema: "stackra.migration-safety/v1", migrations }, errors };
}
