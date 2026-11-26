/**
 * Stackra file contract:
 * Purpose: `ISOLATION_SCOPE_TABLES`, the framework's tables whose owner column is `isolation_scope_id` rather than the
 *          audit's column: `@stackra/database`'s sequence and projection tables (`database.0006_add_isolation_scope`,
 *          contracted by `database.0007_contract_isolation_scope`). `assertRowSecurity` audits each by that column,
 *          against the same setting, with every check and probe of an owned table.
 * Boundary: data only, keyed by the schema-qualified table, named one by one (group (b) by name); no platform entry.
 * Runtime: node
 * Governing contract: ADR 0239 (2026-11-07 amendment, items 3 and 7: group (b)); ADR 0323 (no tenant words in this
 *                     package); ADR 0347 (decision 5).
 */

/** The owner column of each table audited by a column other than the caller's. */
export const ISOLATION_SCOPE_TABLES: ReadonlyMap<string, string> = new Map([
  ["database.sequence_counters", "isolation_scope_id"],
  ["database.sequence_blocks", "isolation_scope_id"],
  ["database.sequence_voids", "isolation_scope_id"],
  ["database.projection_rows", "isolation_scope_id"],
]);
