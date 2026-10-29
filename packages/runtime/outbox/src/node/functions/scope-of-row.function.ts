/**
 * Stackra file contract:
 * Purpose: `scopeOfRow`, the `scope` of a row read back from an outbox table: its `scope_id` and `scope_path` columns
 *          as a `ScopeRef`, or nothing when either is null (a platform write).
 * Boundary: internal to `./node`; the Postgres outbox and change feed drivers spread it into what they
 *           return, so the two read a row's scope the same way. It trusts the columns as the drivers parsed them.
 * Runtime: node
 * Governing contract: ADR 0327 and ADR 0323 (a scope is a `ScopeRef`).
 */
import type { PublicId, ScopeRef } from "@stackra/contracts";

/**
 * `{ scope }` from the row's scope columns, or `{}` when either is null.
 *
 * @example
 * return Object.freeze({ occurredAt: row.occurred_at, ...scopeOfRow(row) });
 */
export function scopeOfRow(row: {
  readonly scope_id: string | null;
  readonly scope_path: string | null;
}): { readonly scope?: ScopeRef } {
  return row.scope_id === null || row.scope_path === null
    ? {}
    : { scope: { id: row.scope_id as PublicId<"scp">, path: row.scope_path } };
}
