/**
 * Stackra file contract:
 * Purpose: `callerScopeOf(storage)`, the scope the running action or query call acts in, for the push and schedule
 *          boundaries to hold a queued job to it.
 * Boundary: pure over the `ContextStorage` the pipeline runs each call in; `undefined` when there is no storage, no
 *           running call (platform code: a scheduler tick, startup) or a call with no scope (a platform call).
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decisions 6 and 7: the current scope is part of the call, never request input);
 *                     ADR 0098.
 */
import type { ContextStorage } from "@stackra/actions/contracts";
import type { ScopeRef } from "@stackra/contracts";

/**
 * The running call's scope.
 *
 * @example
 * assertPlatformScope(options.scope, callerScopeOf(this.calls));
 */
export function callerScopeOf(storage: ContextStorage | undefined): ScopeRef | undefined {
  const current = storage?.current() as { readonly scope?: ScopeRef } | undefined;
  return current?.scope;
}
