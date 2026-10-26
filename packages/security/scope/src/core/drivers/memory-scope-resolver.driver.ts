/**
 * Stackra file contract:
 * Purpose: `MemoryScopeResolverDriver`, the `memory` `ScopeResolver` a test's `useDrivers("memory")` picks: the
 *          verified token's claim, then the root at `ScopeConfig.root`, both looked up in the `ScopeTree`; no answer
 *          refuses `scope_unresolved`, as the chain does.
 * Boundary: needs no `GrantedScopes` (no iam in a test), so it never reads the untrusted `X-Scope-Path` header: the
 *           header step is the chain's alone, and a test that needs it binds `chain`. It sets no session setting.
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decision 7); ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers).
 */
import { Driver } from "@stackra/container";
import type { ScopeRef } from "@stackra/contracts";

import type { ScopeConfig } from "#config/scope.config";
import { ScopeResolver } from "#contracts/index";
import type { ScopeRequest, ScopeTree } from "#contracts/index";
import { ScopeUnresolvedError } from "#core/errors/scope-unresolved.error";
import { isScopePath } from "#core/functions/is-scope-path.function";

/**
 * The claim, else the root.
 *
 * @example
 * await new MemoryScopeResolverDriver(new MemoryScopeTreeDriver(entries), config).resolve({ actor, claim: "platform.acme" });
 */
export class MemoryScopeResolverDriver extends Driver(ScopeResolver) {
  /** Where the nodes are looked up. */
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

  /**
   * The node the claim names, else the root.
   *
   * @throws ScopeUnresolvedError when the tree shows neither.
   */
  async resolve(request: ScopeRequest): Promise<ScopeRef> {
    const claimed =
      request.claim !== undefined && isScopePath(request.claim)
        ? await this.tree.byPath(request.claim)
        : undefined;
    const scope = claimed ?? (await this.tree.byPath(this.config.root));
    if (scope === undefined) throw ScopeUnresolvedError.create();
    return scope;
  }
}
