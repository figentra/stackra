/**
 * Stackra file contract:
 * Purpose: `HeaderScopeResolverDriver`, the first step of the resolver chain: the scope the client asked for in
 *          `X-Scope-Path`, when it is a scope path at or below one the caller holds a grant for and the tree has it.
 * Boundary: the header is untrusted, so a malformed path, a path outside every grant, and a path with no node are all
 *           dropped (`undefined`, the next step decides), never refused: the client cannot probe which scopes exist.
 *           No grant means the header is never accepted.
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decision 7); `.agents/rules/tenancy.md` (point 4); ADR 0208 (grants inherit downward).
 */
import { Driver } from "@stackra/container";
import type { ScopeRef } from "@stackra/contracts";

import { ScopeResolver } from "#contracts/index";
import type { ScopeRequest, GrantedScopes, ScopeTree } from "#contracts/index";
import { isScopePath } from "#core/functions/is-scope-path.function";
import { isWithinScope } from "#core/functions/is-within-scope.function";

/**
 * The header step.
 *
 * @example
 * const step = new HeaderScopeResolverDriver(tree, granted);
 * await step.resolve({ actor, header: "platform.acme" }); // the node, when the actor holds a grant at or above it
 */
export class HeaderScopeResolverDriver extends Driver(ScopeResolver) {
  /** Where the node is looked up. */
  private readonly tree: ScopeTree;

  /** What the caller may enter. */
  private readonly granted: GrantedScopes;

  /**
   * @param tree - the scope tree.
   * @param granted - the caller's granted scopes.
   */
  constructor(tree: ScopeTree, granted: GrantedScopes) {
    super();
    this.tree = tree;
    this.granted = granted;
  }

  /** The node the header names, or `undefined` when there is no header or it is dropped. */
  async resolve(request: ScopeRequest): Promise<ScopeRef | undefined> {
    const path = request.header?.trim();
    if (path === undefined || !isScopePath(path)) return undefined;
    const grants = await this.granted.of(request.actor);
    if (!grants.some((grant) => isWithinScope(path, grant.path))) return undefined;
    return this.tree.byPath(path);
  }
}
