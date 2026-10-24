/**
 * Stackra file contract:
 * Purpose: pins the exports of the `./contracts` entry of @stackra/scope: the three ports at run time, and the types
 *          `ScopeEntry`, `ScopeLevel`, `ScopeNodeDraft` and `ScopeRequest` at compile time (an entry, a level, a draft
 *          and a request typecheck; a level-less entry, a wrong id prefix and a request without an actor are refused).
 *          `ScopeRef` is not re-exported.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); ADR 0327 (decisions 2, 3, 5 and 7).
 */
import { ActorKind, Realm } from "@stackra/contracts";
import type { ScopeRef } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { ScopeEntry, ScopeLevel, ScopeNodeDraft, ScopeRequest } from "#contracts/index";
import { GrantedScopes } from "#contracts/ports/granted-scopes.port";
import { ScopeResolver } from "#contracts/ports/scope-resolver.port";
import { ScopeTree } from "#contracts/ports/scope-tree.port";

const ROOT: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w3", path: "platform" };

describe("@stackra/scope/contracts", () => {
  it("exports exactly the three ports, and no ScopeRef", () => {
    expect(Object.keys(contracts).sort()).toEqual(["GrantedScopes", "ScopeResolver", "ScopeTree"]);
    expect(contracts.GrantedScopes).toBe(GrantedScopes);
    expect(contracts.ScopeResolver).toBe(ScopeResolver);
    expect(contracts.ScopeTree).toBe(ScopeTree);
  });

  it("types an entry as a ScopeRef with its level and name", () => {
    const entry: ScopeEntry = { ...ROOT, level: "platform", name: "Platform" };
    expectTypeOf(entry).toExtend<ScopeRef>();
    // @ts-expect-error -- an entry names its level
    const levelless: ScopeEntry = { ...ROOT, name: "Platform" };
    // @ts-expect-error -- the id is a scope node's, prefix scp
    const wrongPrefix: ScopeEntry = { ...entry, id: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3" };
    expect([entry, levelless, wrongPrefix]).toHaveLength(3);
  });

  it("types a level, a draft and a request", () => {
    const level: ScopeLevel = { key: "product", recursive: false };
    const draft: ScopeNodeDraft = { parent: ROOT, level: level.key, label: "acme", name: "Acme" };
    const root: ScopeNodeDraft = { level: "platform", label: "platform", name: "Platform" };
    const actor = {
      kind: ActorKind.User,
      id: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
      realm: Realm.Platform,
    } as const;
    const request: ScopeRequest = { actor, header: "platform.acme" };
    // @ts-expect-error -- a request always names its verified caller
    const anonymous: ScopeRequest = { header: "platform.acme" };
    expect([draft, root, request, anonymous]).toHaveLength(4);
    expectTypeOf<ScopeRequest["claim"]>().toEqualTypeOf<string | undefined>();
  });
});
