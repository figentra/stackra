/**
 * Stackra file contract:
 * Purpose: the `ScopeResolver` port: resolves the scope of a request. Each step of the chain is a driver of it (the
 *          `X-Scope-Path` header, the token claim, the root), and the chain is one too (`ChainScopeResolverDriver`),
 *          so a consumer injects `ScopeResolver` and gets the whole chain.
 * Boundary: an abstract class that is its own token. A step answers a scope or `undefined` to pass the request to the
 *           next step; it never trusts request input alone (the header is checked against the caller's grants).
 *           Tenancy contributes its step as another driver placed before the root (ADR 0327 d7 and d8).
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decision 7); ADR 0142 (drivers behind a port); `.agents/rules/tenancy.md` (point 4).
 */
import { Port } from "@stackra/contracts";
import type { ScopeRef } from "@stackra/contracts";

import type { ScopeRequest } from "#contracts/types/scope-request.type";

/**
 * One step of the resolver chain, or the chain itself.
 *
 * @example
 * export class SessionScopeResolverDriver extends Driver(ScopeResolver) {
 *   async resolve(request: ScopeRequest): Promise<ScopeRef | undefined> {
 *     return this.sessions.lastScopeOf(request.actor.id);
 *   }
 * }
 */
export abstract class ScopeResolver extends Port {
  /** The scope this resolver reads from `request`, or `undefined` when it has no answer. */
  abstract resolve(request: ScopeRequest): Promise<ScopeRef | undefined>;
}
