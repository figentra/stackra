/**
 * Stackra file contract:
 * Purpose: unit tests of `HeaderScopeResolverDriver`: a header at or below a granted path resolves to its node; no
 *          header, a malformed one, one outside every grant, one beside a grant, one for a missing node, and any header
 *          from a caller with no grant are dropped (`undefined`), never refused.
 * Boundary: test only; the tree is the memory driver and the grants a stand-in driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0327 (decision 7); `.agents/rules/tenancy.md` (point 4).
 */
import { Driver } from "@stackra/container";
import { ActorKind, Realm } from "@stackra/contracts";
import type { Actor, ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { GrantedScopes, ScopeResolver } from "#contracts/index";
import type { ScopeEntry } from "#contracts/index";
import { HeaderScopeResolverDriver } from "#core/drivers/header-scope-resolver.driver";
import { MemoryScopeTreeDriver } from "#core/drivers/memory-scope-tree.driver";

const ACME: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1",
  path: "platform.acme",
  level: "product",
  name: "Acme",
};
const ACME_EU: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w2",
  path: "platform.acme.eu",
  level: "store",
  name: "Acme EU",
};
const OTHER: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w3",
  path: "platform.other",
  level: "product",
  name: "Other",
};

const MEMBER: Actor = {
  kind: ActorKind.User,
  id: "usr_01j9z3k4m5n6p7q8r9s0t1v2w1",
  realm: Realm.Platform,
};
const STRANGER: Actor = {
  kind: ActorKind.User,
  id: "usr_01j9z3k4m5n6p7q8r9s0t1v2w2",
  realm: Realm.Platform,
};

class AcmeGrantsDriver extends Driver(GrantedScopes) {
  async of(actor: Actor): Promise<readonly ScopeRef[]> {
    return actor.id === MEMBER.id ? [ACME] : [];
  }
}

const step = new HeaderScopeResolverDriver(
  new MemoryScopeTreeDriver([ACME, ACME_EU, OTHER]),
  new AcmeGrantsDriver(),
);

describe(HeaderScopeResolverDriver, () => {
  it("is a ScopeResolver", () => {
    expect(step).toBeInstanceOf(ScopeResolver);
  });

  it("resolves a header at or below a granted path", async () => {
    await expect(step.resolve({ actor: MEMBER, header: "platform.acme" })).resolves.toBe(ACME);
    await expect(step.resolve({ actor: MEMBER, header: " platform.acme.eu " })).resolves.toBe(
      ACME_EU,
    );
  });

  it.each([
    ["no header", undefined],
    ["an empty header", ""],
    ["a malformed header", "platform.acme.*"],
    ["a header outside every grant", "platform.other"],
    ["a header above the grant", "platform"],
    ["a header beside the grant", "platform.acme_eu"],
    ["a header for a missing node", "platform.acme.us"],
  ])("drops %s", async (_name, header) => {
    await expect(
      step.resolve({ actor: MEMBER, ...(header === undefined ? {} : { header }) }),
    ).resolves.toBeUndefined();
  });

  it("drops every header from a caller with no grant", async () => {
    await expect(
      step.resolve({ actor: STRANGER, header: "platform.acme" }),
    ).resolves.toBeUndefined();
  });
});
