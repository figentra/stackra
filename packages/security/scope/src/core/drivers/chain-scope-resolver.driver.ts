/**
 * Stackra file contract:
 * Purpose: `ChainScopeResolverDriver`, the resolver chain the transport asks once per request: the header step, the
 *          token-claim step, then the root step, the first answer winning; no answer refuses `scope_unresolved`.
 * Boundary: the `ScopeResolver` binding of an app. The order is ADR 0327 decision 7's. Tenancy places its own step
 *           before the root with a host override that adds a constructor parameter and overrides `steps()`. The chain
 *           only picks a scope: it sets no session setting and filters no row (the transport runs the call inside
 *           `Database.withScope` with the answer).
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decisions 7 and 9); ADR 0142 (drivers behind a port); ADR 0306 (overrides).
 */
import { Driver } from "@stackra/container";
import type { ScopeRef } from "@stackra/contracts";

import { ScopeResolver } from "#contracts/index";
import type { ScopeRequest } from "#contracts/index";
import { ClaimScopeResolverDriver } from "#core/drivers/claim-scope-resolver.driver";
import { HeaderScopeResolverDriver } from "#core/drivers/header-scope-resolver.driver";
import { RootScopeResolverDriver } from "#core/drivers/root-scope-resolver.driver";
import { ScopeUnresolvedError } from "#core/errors/scope-unresolved.error";

/**
 * The chain.
 *
 * @example
 * const scope = await chain.resolve({ actor, header: headers.get(SCOPE_PATH_HEADER) ?? undefined, claim });
 * await database.withScope(scope, () => pipeline.execute(type, input, { actor }));
 */
export class ChainScopeResolverDriver extends Driver(ScopeResolver) {
  /** The `X-Scope-Path` step. */
  private readonly header: HeaderScopeResolverDriver;

  /** The token-claim step. */
  private readonly claim: ClaimScopeResolverDriver;

  /** The root step. */
  private readonly root: RootScopeResolverDriver;

  /**
   * @param header - the header step.
   * @param claim - the token-claim step.
   * @param root - the root step.
   */
  constructor(
    header: HeaderScopeResolverDriver,
    claim: ClaimScopeResolverDriver,
    root: RootScopeResolverDriver,
  ) {
    super();
    this.header = header;
    this.claim = claim;
    this.root = root;
  }

  /**
   * The first step's answer.
   *
   * @throws ScopeUnresolvedError when no step answers.
   */
  async resolve(request: ScopeRequest): Promise<ScopeRef> {
    for (const step of this.steps()) {
      const scope = await step.resolve(request);
      if (scope !== undefined) return scope;
    }
    throw ScopeUnresolvedError.create();
  }

  /** The steps in the order they are asked; an override inserts a step before the root. */
  protected steps(): readonly ScopeResolver[] {
    return [this.header, this.claim, this.root];
  }
}
