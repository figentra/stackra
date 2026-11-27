/**
 * Stackra file contract:
 * Purpose: `checkMigrationLock`, the frozen-migration rule of gen: a migration locked in the committed
 *          `stackra.manifest.json` (its id and SHA-256 in the `migrations` section) may already be applied, so it
 *          never changes. A locked migration whose compiled SHA-256 differs is refused (`migration_locked_changed`), so
 *          is a locked migration that is gone (`migration_locked_missing`: deleted, renamed, or its package removed),
 *          and a locked migration that runs after one that is not locked, its module's previous migration or an
 *          `after` id (`migration_lock_gap`), since the locked ones keep their place at the head of the order.
 * Boundary: pure. A migration with no lock entry is not judged here: it is still editable and meets every rule. Gen
 *           cannot see a database; an applied file that changed is refused by the runner (`stackra db migrate`, its
 *           checksum ledger), and the lock is what gen can see.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (2026-10-23 note: the SHA-256 lock, a released prefix does not move; decision 4:
 *                     forward fix only); STA-2160 (frozen by locked or applied state, not by merge).
 */
import type { GenError } from "#core/types/gen-error.type";
import type { LockedMigration } from "#core/types/locked-migration.type";
import type { MigrationUnit } from "#core/types/migration-unit.type";

/** How an unapplied migration is unlocked: by hand, in a reviewed diff of the committed manifest. */
const UNLOCK =
  "only when no environment has applied it, remove its entry from `migrations` in stackra.manifest.json and run stackra gen again";

/** The module of a migration id. */
const moduleOf = (id: string): string => id.slice(0, id.indexOf("."));

/**
 * The refusals of `units` against the committed `locked` migrations.
 *
 * @param locked - the committed lock, in apply order (`migrationLockOf`).
 * @param units - this run's compiled migrations, each with its `sha256`.
 * @example
 * checkMigrationLock(committed, units).map((error) => error.code); // ["migration_locked_changed"]
 */
export function checkMigrationLock(
  locked: readonly LockedMigration[],
  units: readonly MigrationUnit[],
): GenError[] {
  const errors: GenError[] = [];
  const byId = new Map(units.map((unit) => [unit.id, unit]));
  const lockedIds = new Set(locked.map((entry) => entry.id));
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  const sorted = [...byId.keys()].sort();
  for (const entry of locked) {
    const unit = byId.get(entry.id);
    if (unit === undefined) {
      errors.push({
        code: "migration_locked_missing",
        file: "stackra.manifest.json",
        line: 0,
        column: 0,
        subject: entry.id,
        message: `${entry.id} is locked in stackra.manifest.json, but no migration has that id any more (deleted, renamed or its package removed), and a database may already have applied it`,
        fix: `restore the migration file (or the package that ships it) and undo what it did in a new migration; ${UNLOCK}`,
      });
      continue;
    }
    if (unit.sha256 !== entry.sha256)
      errors.push({
        code: "migration_locked_changed",
        file: unit.file,
        line: 0,
        column: 0,
        subject: entry.id,
        message: `${entry.id} is locked in stackra.manifest.json, but it compiles to other SQL now (sha256 ${entry.sha256.slice(0, 12)} locked, ${(unit.sha256 ?? "none").slice(0, 12)} now)`,
        fix: `restore the migration as it was locked and make the change in a new migration (ADR 0159: a locked migration is frozen); ${UNLOCK}`,
      });
    const index = sorted.indexOf(entry.id);
    const previous = sorted[index - 1];
    const before = [
      ...(previous !== undefined && moduleOf(previous) === moduleOf(entry.id) ? [previous] : []),
      ...unit.after.filter((id) => byId.has(id)),
    ];
    for (const id of before.filter((need) => !lockedIds.has(need)))
      errors.push({
        code: "migration_lock_gap",
        file: unit.file,
        line: 0,
        column: 0,
        subject: entry.id,
        message: `${entry.id} is locked, but ${id}, which runs before it, is not, so ${id} would run after a migration a database may already have applied`,
        fix: `restore ${id} as it was locked (its entry in \`migrations\` of stackra.manifest.json from the last commit), or unlock ${entry.id} too when no environment has applied either`,
      });
  }
  return errors;
}
