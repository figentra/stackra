/**
 * Stackra file contract:
 * Purpose: `orderMigrations`, the apply order of a host's migrations, its own and its declared packages': each
 *          module's migrations in number order, every `Migration({ after })` id before the migration naming it, ties
 *          broken by package migrations first and then by id, so the order is the same on every run.
 * Boundary: pure. Refuses an `after` id no loaded migration has (`migration_after_unknown`), a migration id loaded
 *           twice (`migration_id_duplicate`) and a cycle (`migration_cycle`); with a refusal the order is empty.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decisions 1 and 2, as amended 2026-10-24: ordering across members is gen's).
 */
import type { GenError } from "#core/types/gen-error.type";
import type { MigrationUnit } from "#core/types/migration-unit.type";

/** One refusal on a migration file. */
const refusal = (code: string, unit: MigrationUnit, message: string, fix: string): GenError => ({
  code,
  file: unit.file,
  line: 0,
  column: 0,
  subject: unit.id,
  message,
  fix,
});

/** The module of a migration id. */
const moduleOf = (id: string): string => id.slice(0, id.indexOf("."));

/**
 * Orders `units` for the runner.
 *
 * @example
 * orderMigrations([billing0001, search0001]).ordered.map((unit) => unit.id);
 * // ["search.0001_create_text_functions", "billing.0001_create_invoices"] when billing's runs after search's
 */
export function orderMigrations(units: readonly MigrationUnit[]): {
  readonly ordered: readonly MigrationUnit[];
  readonly errors: readonly GenError[];
} {
  const errors: GenError[] = [];
  const byId = new Map<string, MigrationUnit>();
  for (const unit of units) {
    if (byId.has(unit.id))
      errors.push(
        refusal(
          "migration_id_duplicate",
          unit,
          `${unit.id} is loaded twice (${byId.get(unit.id)?.file} and ${unit.file})`,
          "keep one copy of the package, or renumber the member's own migration",
        ),
      );
    else byId.set(unit.id, unit);
  }
  // Edges: the previous migration of the same module, then each `after` id.
  const needs = new Map<string, Set<string>>();
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  const sorted = [...byId.keys()].sort();
  for (const [index, id] of sorted.entries()) {
    const unit = byId.get(id) as MigrationUnit;
    const before = new Set<string>();
    const previous = sorted[index - 1];
    if (previous !== undefined && moduleOf(previous) === moduleOf(id)) before.add(previous);
    for (const after of unit.after) {
      if (byId.has(after)) before.add(after);
      else
        errors.push(
          refusal(
            "migration_after_unknown",
            unit,
            `${id} runs after ${after}, but no loaded migration has that id`,
            `add the package that owns ${after} to package.json dependencies, or fix the id in Migration({ after })`,
          ),
        );
    }
    needs.set(id, before);
  }
  if (errors.length > 0) return { ordered: [], errors };
  const rank = (id: string): string => `${byId.get(id)?.owner === "package" ? 0 : 1}${id}`;
  const ordered: MigrationUnit[] = [];
  const done = new Set<string>();
  while (done.size < needs.size) {
    const ready = [...needs]
      .filter(([id, before]) => !done.has(id) && [...before].every((need) => done.has(need)))
      .map(([id]) => id)
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort((a, b) => (rank(a) < rank(b) ? -1 : 1));
    const next = ready[0];
    if (next === undefined) {
      const stuck = [...needs.keys()].filter((id) => !done.has(id));
      return {
        ordered: [],
        errors: stuck.map((id) =>
          refusal(
            "migration_cycle",
            byId.get(id) as MigrationUnit,
            `${id} is part of a migration cycle among ${stuck.join(", ")}`,
            "remove one Migration({ after }) id so the migrations have one order",
          ),
        ),
      };
    }
    done.add(next);
    ordered.push(byId.get(next) as MigrationUnit);
  }
  return { ordered, errors: [] };
}
