/**
 * Stackra file contract:
 * Purpose: `ScopeRef`, a reference to one node of the scope tree a call acts inside: the node's public id and its
 *          materialised path. Packages that isolate data by scope (the database's session settings, settings scope
 *          levels, entitlement grants) take it instead of naming a tenant or a level (ADR 0323, 0327).
 * Boundary: a type only. Levels are deployment data (ADR 0327 d2), so a ref carries no level; the path is the node's
 *           `ltree` path, which makes ancestor matching (`scope_path <@ path`) possible without a lookup. The id is the
 *           authenticated principal's scope, never request input. The type lives here, the leaf, so that
 *           `@stackra/database` and `@stackra/scope` need no cycle; `@stackra/scope` owns its semantics and the
 *           resolver and imports it (ADR 0327 d5 and ADR 0323, notes of 2026-10-24).
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decisions 3 and 5); ADR 0323 (every other package speaks of a scope through ScopeRef).
 */
import type { PublicId } from "#core/types/public-id.type";

/**
 * One scope node: `{ id: "scp_…", path: "platform.acme.shop_eu" }`. `withScope(ref, work)` sets the database
 * settings `app.scope_id` and `app.scope_path` for the transaction.
 *
 * @example
 * await database.withScope({ id: principal.scopeId, path: principal.scopePath }, () => work());
 */
export interface ScopeRef {
  /** The node's public id. */
  readonly id: PublicId<"scp">;

  /** The node's materialised `ltree` path, root first, labels separated by dots. */
  readonly path: string;
}
