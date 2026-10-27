/**
 * Stackra file contract:
 * Purpose: unit tests of `ChainScopeResolverDriver`: the order of ADR 0327 decision 7 (a granted header wins over the
 *          claim, the claim over the root, the root when neither answers, a dropped header falls through), the
 *          `scope_unresolved` refusal when no step answers, and a host override that places a step before the root.
 * Boundary: test only; the steps are the real drivers over the memory tree and a stand-in grant driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0327 (decision 7); ADR 0306 (overrides).
 */
import { buildConfig } from "@stackra/config";
import { Driver } from "@stackra/container";
import { ActorKind, Realm } from "@stackra/contracts";
import type { Actor, ScopeRef } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ScopeConfig } from "#config/scope.config";
import { GrantedScopes, ScopeResolver } from "#contracts/index";
import type { ScopeEntry, ScopeRequest } from "#contracts/index";
import {
  ChainScopeResolverDriver,
  ChainScopeResolverDriver as BaseChainScopeResolverDriver,
} from "#core/drivers/chain-scope-resolver.driver";
import { ClaimScopeResolverDriver } from "#core/drivers/claim-scope-resolver.driver";
import { HeaderScopeResolverDriver } from "#core/drivers/header-scope-resolver.driver";
import { MemoryScopeTreeDriver } from "#core/drivers/memory-scope-tree.driver";
import { RootScopeResolverDriver } from "#core/drivers/root-scope-resolver.driver";
import { ScopeUnresolvedError } from "#core/errors/scope-unresolved.error";

const ROOT: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w0",
  path: "platform",
  level: "platform",
  name: "Platform",
};
const ACME: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1",
  path: "platform.acme",
  level: "product",
  name: "Acme",
};
const OTHER: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w3",
  path: "platform.other",
  level: "product",
  name: "Other",
};

const actor: Actor = {
  kind: ActorKind.User,
  id: "usr_01j9z3k4m5n6p7q8r9s0t1v2w1",
  realm: Realm.Platform,
};

class AcmeGrantsDriver extends Driver(GrantedScopes) {
  async of(): Promise<readonly ScopeRef[]> {
    return [ACME];
  }
}

/** A step another package contributes: answers OTHER when the request carries no claim. */
class ContributedScopeResolverDriver extends Driver(ScopeResolver) {
  async resolve(request: ScopeRequest): Promise<ScopeRef | undefined> {
    return request.claim === undefined ? OTHER : undefined;
  }
}

/** The steps over `entries`. */
function stepsOver(entries: readonly ScopeEntry[]) {
  const tree = new MemoryScopeTreeDriver().seed(entries);
  return [
    new HeaderScopeResolverDriver(tree, new AcmeGrantsDriver()),
    new ClaimScopeResolverDriver(tree),
    new RootScopeResolverDriver(tree, buildConfig(ScopeConfig)),
  ] as const;
}

/** A host override that asks the contributed step before the root. */
class OverriddenChainScopeResolverDriver extends BaseChainScopeResolverDriver {
  private readonly contributed: ContributedScopeResolverDriver;

  constructor(
    header: HeaderScopeResolverDriver,
    claim: ClaimScopeResolverDriver,
    root: RootScopeResolverDriver,
    contributed: ContributedScopeResolverDriver,
  ) {
    super(header, claim, root);
    this.contributed = contributed;
  }

  protected override steps(): readonly ScopeResolver[] {
    const [header, claim, root] = super.steps();
    return [header, claim, this.contributed, root].filter(
      (step): step is ScopeResolver => step !== undefined,
    );
  }
}

describe(ChainScopeResolverDriver, () => {
  const chain = new ChainScopeResolverDriver(...stepsOver([ROOT, ACME, OTHER]));

  it("is a ScopeResolver", () => {
    expect(chain).toBeInstanceOf(ScopeResolver);
  });

  it("asks the header, then the claim, then the root", async () => {
    await expect(
      chain.resolve({ actor, header: "platform.acme", claim: "platform.other" }),
    ).resolves.toBe(ACME);
    await expect(chain.resolve({ actor, claim: "platform.other" })).resolves.toBe(OTHER);
    await expect(chain.resolve({ actor })).resolves.toBe(ROOT);
  });

  it("falls through a dropped header", async () => {
    await expect(chain.resolve({ actor, header: "platform.other" })).resolves.toBe(ROOT);
    await expect(
      chain.resolve({ actor, header: "platform.other", claim: "platform.acme" }),
    ).resolves.toBe(ACME);
  });

  it("refuses scope_unresolved when no step answers", async () => {
    const empty = new ChainScopeResolverDriver(...stepsOver([]));
    const refused = await empty.resolve({ actor }).catch((error: unknown) => error);
    expect(isRefusal(refused, ScopeUnresolvedError)).toBe(true);
  });

  it("takes a contributed step before the root in a host override", async () => {
    const overridden = new OverriddenChainScopeResolverDriver(
      ...stepsOver([ROOT, ACME, OTHER]),
      new ContributedScopeResolverDriver(),
    );
    await expect(overridden.resolve({ actor })).resolves.toBe(OTHER);
    await expect(overridden.resolve({ actor, header: "platform.acme" })).resolves.toBe(ACME);
  });
});
