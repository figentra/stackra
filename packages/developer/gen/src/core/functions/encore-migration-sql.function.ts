/**
 * Stackra file contract:
 * Purpose: `encoreMigrationSql(content)`, the Encore copy of one compiled migration file. Encore's runner appends its
 *          `schema_migrations` insert to each file and sends the two as one query, so every file runs in one implicit
 *          transaction and a concurrent statement fails (SQLSTATE 25001). A file that opens with
 *          `-- stackra:transactional=false` therefore loses that marker, which Encore cannot honour, and each of its
 *          concurrent statements becomes its plain form; any other file is returned as it is.
 * Boundary: pure; only the Encore copy goes through it, so `.stackra/migrations` keeps the online form that
 *           `stackra db migrate` applies.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decision 3; the amendments of 2026-10-24 and 2026-11-10).
 */

/** The header `emitMigrations` opens a non-transactional step with. */
const NON_TRANSACTIONAL = "-- stackra:transactional=false\n";

/** The statements Postgres refuses in a transaction while they say `concurrently`. */
const CONCURRENT =
  /\b(create\s+(?:unique\s+)?index|drop\s+index|reindex\s+(?:index|table|schema|database|system)|refresh\s+materialized\s+view)\s+concurrently\b/gi;

/** The line that replaces the marker, so the copy says why it differs from `.stackra/migrations`. */
const NOTE =
  "-- Encore runs this file in one transaction, so its online build is the plain form here (ADR 0159).\n";

/**
 * The content Encore applies for the compiled migration file `content`.
 *
 * @param content - one `.up.sql` or `.down.sql` file as `emitMigrations` wrote it.
 * @example
 * encoreMigrationSql('-- stackra:transactional=false\ncreate index concurrently "i" on "a" ("b");\n');
 * // '-- Encore runs this file in one transaction, …\ncreate index "i" on "a" ("b");\n'
 */
export function encoreMigrationSql(content: string): string {
  if (!content.startsWith(NON_TRANSACTIONAL)) return content;
  return NOTE + content.slice(NON_TRANSACTIONAL.length).replace(CONCURRENT, "$1");
}
