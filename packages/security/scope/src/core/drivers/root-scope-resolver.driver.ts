/**
 * Stackra file contract:
 * Purpose: `RootScopeResolverDriver`, the last step of the resolver chain: the root node, at `ScopeConfig.root`, the
 *          default scope of a request that named none.
 * Boundary: answers whatever the tree shows at the root path; under row-level security that is only a caller whose
 *           grants include the root, so for anyone else the chain refuses (`ScopeUnresolvedError`) instead of
 *           widening their scope.
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decision 7: the root fallback).
 */
import { Driver } from "@stackra/container";
import type { ScopeRef } from "@stackra/contracts";

import type { ScopeConfig } from "#config/scope.config";
import type { ScopeTree } from "#contracts/index";
import { ScopeResolver } from "#contracts/index";

/**
 * The root step.
 *
 * @example
 * await new RootScopeResolverDriver(tree, config).resolve(request); // the node at "platform"
 */
export class RootScopeResolverDriver extends Driver(ScopeResolver) {
  /** Where the root is looked up. */
  private readonly tree: ScopeTree;

  /** Names the root's path. */
  private readonly config: ScopeConfig;

  /**
   * @param tree - the scope tree.
   * @param config - the deployment's levels and root.
   */
  constructor(tree: ScopeTree, config: ScopeConfig) {
    super();
    this.tree = tree;
    this.config = config;
  }

  /** The root node, or `undefined` when the tree shows none. */
  async resolve(): Promise<ScopeRef | undefined> {
    return this.tree.byPath(this.config.root);
  }
}
