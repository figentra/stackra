/**
 * Stackra file contract:
 * Purpose: `emitPackageMigrations(units, name)`, the committed compiled SQL of a package's own migrations
 *          (`src/node/database/compiled-migrations/<module>_<NNNN>_<stem>[_<step>].{up,down}.sql`): each step as a host
 *          service's stream holds it, byte for byte (the same `migrationStepFiles`, with the file named as a host names a
 *          declared package's migration, `<name>/src/node/database/migrations/<file>`), without the host's sequence
 *          number. Squawk lints these files where the package is developed, and a host's gen refuses a compile that
 *          differs from them (`migration_package_drift`), so what a host applies is what was committed (STA-2788).
 * Boundary: pure: the package's own units (compiled from its own source) in, files out; a declared package's units are
 *           that package's to commit.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decisions 2 and 3); STA-1689 (a package's own migrations); STA-2788.
 */
import { PACKAGE_MIGRATIONS_DIR } from "#core/constants/package-migrations-dir.constant";
import { migrationStepFiles } from "#core/functions/migration-step-files.function";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MigrationUnit } from "#core/types/migration-unit.type";

/**
 * The committed SQL files of a package's own `units`.
 *
 * @param units - the package's own compiled migrations, each `file` relative to the package root.
 * @param name - the package name, which a host's header names the file under.
 * @example
 * emitPackageMigrations(units, "@stackra/loyalty-kit")[0]?.path;
 * // "src/node/database/compiled-migrations/loyalty_kit_0001_create_loyalty_tables.up.sql"
 */
export function emitPackageMigrations(
  units: readonly MigrationUnit[],
  name: string,
): GeneratedFile[] {
  return units.flatMap((unit) =>
    migrationStepFiles({ ...unit, file: `${name}/${unit.file}` }).flatMap((step) => [
      { path: `${PACKAGE_MIGRATIONS_DIR}/${step.name}.up.sql`, content: step.up },
      ...(step.down === undefined
        ? []
        : [{ path: `${PACKAGE_MIGRATIONS_DIR}/${step.name}.down.sql`, content: step.down }]),
    ]),
  );
}
