/**
 * Stackra file contract:
 * Purpose: `scopeSetting`, the Postgres setting a scope level is held in for a transaction: `app.<level>_id`.
 * Boundary: internal; the one derivation shared by `Database.withScope` (which sets it with `set_config`) and the
 *           blueprint's `rowLevelSecurity(level)` (whose policy reads it with `current_setting`), so the two layers of
 *           isolation always name the same setting. The level is data its owning package contributes.
 * Runtime: node
 * Governing contract: ADR 0239 (row-level security on equality); `.agents/rules/tenancy.md` (two layers).
 */

/** A level code: snake_case. */
const LEVEL = /^[a-z][a-z0-9_]*$/;

/**
 * The setting of `level`.
 *
 * @throws TypeError when `level` is not snake_case.
 * @example
 * scopeSetting("workspace"); // "app.workspace_id"
 */
export function scopeSetting(level: string): string {
  if (!LEVEL.test(level)) throw new TypeError(`"${level}" is not a scope level: snake_case`);
  return `app.${level}_id`;
}
