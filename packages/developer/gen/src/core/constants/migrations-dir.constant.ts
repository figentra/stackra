/**
 * Stackra file contract:
 * Purpose: `MIGRATIONS_DIR`, the folder under the member root the migration target writes its `.up.sql`/`.down.sql`
 *          files to, which the runner (`readMigrationFiles`) and the generated Encore database read.
 * Boundary: a constant only.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decision 2 as amended 2026-10-24); ADR 0295 (generated output lives in `.stackra/`).
 */

/** The compiled migrations folder. */
export const MIGRATIONS_DIR = ".stackra/migrations";
