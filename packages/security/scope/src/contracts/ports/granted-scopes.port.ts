/**
 * Stackra file contract:
 * Purpose: the `GrantedScopes` port: the scopes a principal holds a grant in, so it may enter each of them and every
 *          node below; the header step of the resolver chain checks `X-Scope-Path` against them.
 * Boundary: an abstract class that is its own token, implemented by the package that owns grants (`@stackra/iam`,
 *           ADR 0208: grants inherit downward). No grant is an empty list, which lets the caller enter nothing; it is
 *           never "everything".
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decision 7); ADR 0208 (decisions 1 and 2); `.agents/rules/tenancy.md` (points 3 and
 *                     4: empty granted paths match nothing).
 */
import { Port } from "@stackra/contracts";
import type { Actor, ScopeRef } from "@stackra/contracts";

/**
 * Answers where a principal holds grants.
 *
 * @example
 * export class RoleGrantedScopesDriver extends Driver(GrantedScopes) {
 *   of(actor: Actor): Promise<readonly ScopeRef[]> {
 *     return this.grants.scopesOf(actor.onBehalfOf ?? actor);
 *   }
 * }
 */
export abstract class GrantedScopes extends Port {
  /** The scopes `actor` holds a grant in; empty when it holds none. */
  abstract of(actor: Actor): Promise<readonly ScopeRef[]>;
}
