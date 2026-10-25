/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/scope (the `ScopeTree`, `ScopeResolver` and
 *          `GrantedScopes` ports and their types) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package
 *           (ADR 0294 decision 15). `ScopeRef` itself is @stackra/contracts' (owner decision 2026-10-24), so it is
 *           imported from there and never re-exported here.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0327 (decisions 5 and 10); the STA-347 stand-in barrel decision.
 */
export { GrantedScopes } from "#contracts/ports/granted-scopes.port";
export { ScopeResolver } from "#contracts/ports/scope-resolver.port";
export { ScopeTree } from "#contracts/ports/scope-tree.port";
export type { ScopeEntry } from "#contracts/types/scope-entry.type";
export type { ScopeLevel } from "#contracts/types/scope-level.type";
export type { ScopeNodeDraft } from "#contracts/types/scope-node-draft.type";
export type { ScopeRequest } from "#contracts/types/scope-request.type";
