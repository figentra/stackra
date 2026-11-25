/**
 * Stackra file contract:
 * Purpose: `PACKAGE_MIGRATIONS_DIR`, the folder under a package root that holds the compiled SQL of the package's own
 *          migrations, one file per step without a sequence number (`emitPackageMigrations`). It is committed and
 *          shipped (package.json `files` has `src`), so Squawk lints it in the package's repository and a host's gen
 *          refuses a host compile that differs from it (`migration_package_drift`): the SQL a host applies is the SQL
 *          the package committed (STA-2788).
 * Boundary: a constant only.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decision 3: the compiled stream, Squawk); STA-2788.
 */

/** The committed compiled migrations of a package, relative to its root. */
export const PACKAGE_MIGRATIONS_DIR = "src/node/database/compiled-migrations";
