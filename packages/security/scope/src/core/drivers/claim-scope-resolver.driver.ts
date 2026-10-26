/**
 * Stackra file contract:
 * Purpose: `ClaimScopeResolverDriver`, the second step of the resolver chain: the scope path the verified token
 *          carries, when it is a scope path the tree has.
 * Boundary: the claim comes from the verified credential, so it is not checked against grants; a malformed claim or a
 *           path with no visible node passes the request to the next step (`undefined`).
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decision 7); ADR 0098 (the caller comes from the verified credential).
 */
import { Driver } from "@stackra/container";
import type { ScopeRef } from "@stackra/contracts";

import { ScopeResolver } from "#contracts/index";
import type { ScopeRequest, ScopeTree } from "#contracts/index";
import { isScopePath } from "#core/functions/is-scope-path.function";

/**
 * The token-claim step.
 *
 * @example
 * await new ClaimScopeResolverDriver(tree).resolve({ actor, claim: "platform.acme" });
 */
export class ClaimScopeResolverDriver extends Driver(ScopeResolver) {
  /** Where the node is looked up. */
  private readonly tree: ScopeTree;

  /**
   * @param tree - the scope tree.
   */
  constructor(tree: ScopeTree) {
    super();
    this.tree = tree;
  }

  /** The node the claim names, or `undefined` when there is no usable claim. */
  async resolve(request: ScopeRequest): Promise<ScopeRef | undefined> {
    const { claim } = request;
    if (claim === undefined || !isScopePath(claim)) return undefined;
    return this.tree.byPath(claim);
  }
}
