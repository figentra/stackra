/**
 * Stackra file contract:
 * Purpose: `ScopeRequest`, what each step of the resolver chain reads from one request: the verified caller, the
 *          `X-Scope-Path` header as sent, and the scope path claim of the verified token.
 * Boundary: a type only, built by the transport from the authenticated request. The header is untrusted input: a
 *           step accepts it only inside a path the caller holds a grant for and drops it otherwise. The claim and the
 *           actor come from the verified credential, never from a body.
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decision 7); `.agents/rules/tenancy.md` (point 4: the one client header); ADR 0098
 *                     (the typed actor).
 */
import type { Actor } from "@stackra/contracts";

/**
 * One request's scope inputs.
 *
 * @example
 * const request: ScopeRequest = { actor, header: headers.get(SCOPE_PATH_HEADER) ?? undefined, claim: token.scopePath };
 */
export interface ScopeRequest {
  /** The verified caller. */
  readonly actor: Actor;

  /** The `X-Scope-Path` header as the client sent it; absent when it sent none. */
  readonly header?: string;

  /** The scope path the verified token carries; absent when it carries none. */
  readonly claim?: string;
}
