/**
 * Stackra file contract:
 * Purpose: `PLATFORM_TABLES`, the framework's tables that hold no owner column by design, each with the reason its
 *          migration gives; `assertRowSecurity` accepts them beside the caller's own `platform` entries, and reports
 *          every other table without the owner column.
 * Boundary: data only, keyed by the schema-qualified table. A row is added only with the migration that states why
 *           the table is not tenant data, never to quiet the audit; a table that holds tenant rows takes the owner
 *           column instead.
 * Runtime: node
 * Governing contract: ADR 0347 (decision 5: the catalogue audit); ADR 0210 (2026-10-24 amendment: global by design);
 *                     `.agents/rules/tenancy.md` (point 7).
 */

/** Platform table to the reason it holds no owner column. */
export const PLATFORM_TABLES: ReadonlyMap<string, string> = new Map([
  [
    "public.schema_migrations",
    "the migration runner's version row (golang-migrate's shape), written outside any tenant",
  ],
  ["public.schema_migrations_history", "the migration runner's ledger of applied files"],
  [
    "database.idempotency_keys",
    "database.0002: claimed before the call's scope session opens; each key is already scoped",
  ],
  [
    "database.rate_limit_buckets",
    "database.0002: claimed before the call's scope session opens; each key is already scoped",
  ],
  [
    "cache.entries",
    "database.0005: a key carries its CacheNamespace prefix; written outside the caller's transaction",
  ],
  [
    "cache.set_members",
    "database.0005: a key carries its CacheNamespace prefix; written outside the caller's transaction",
  ],
  ["locking.lock_tokens", "locking.0001: a lock key is not tenant data"],
]);
