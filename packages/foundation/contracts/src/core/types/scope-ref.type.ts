/**
 * Stackra file contract:
 * Purpose: `ScopeRef`, a reference to one scope a call acts inside: its level and its id. Packages that isolate data
 *          by scope (the database's session settings, settings scope levels) take it instead of naming a level.
 * Boundary: a type only. The levels are data the owning package contributes (@stackra/tenancy contributes its own), so
 *           no other package spells a level name. The id is the authenticated principal's scope, never request input.
 * Runtime: isomorphic
 * Governing contract: ADR 0239 (row-level security on equality); ADR 0231 (snake_case codes).
 */

/**
 * One scope: `{ level: "workspace", id }` sets the database setting `app.workspace_id` for the transaction.
 *
 * @example
 * await database.withScope({ level: "workspace", id: principal.workspaceId }, () => work());
 */
export interface ScopeRef {
  /** The level's code, snake_case, contributed by the package that owns the level. */
  readonly level: string;

  /** The scope's id at that level. */
  readonly id: string;
}
