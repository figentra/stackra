/**
 * Stackra file contract:
 * Purpose: unit tests of the `ScopeTree` port: it is an abstract `Port` (its own token, never built directly) and a
 *          driver answers a node by id and by path, its ancestors and its descendants as `ScopeEntry` values.
 * Boundary: test only; the driver here is a stand-in over a fixed list.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0327 (decision 3).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import type { PublicId, ScopeRef } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ScopeTree } from "#contracts/ports/scope-tree.port";
import type { ScopeEntry } from "#contracts/types/scope-entry.type";

const ROOT: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w3",
  path: "platform",
  level: "platform",
  name: "Platform",
};

const ACME: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w4",
  path: "platform.acme",
  level: "product",
  name: "Acme",
};

class ListScopeTreeDriver extends Driver(ScopeTree) {
  async node(id: PublicId<"scp">): Promise<ScopeEntry | undefined> {
    return [ROOT, ACME].find((entry) => entry.id === id);
  }

  async byPath(path: string): Promise<ScopeEntry | undefined> {
    return [ROOT, ACME].find((entry) => entry.path === path);
  }

  async ancestors(scope: ScopeRef): Promise<readonly ScopeEntry[]> {
    return scope.path === ACME.path ? [ROOT] : [];
  }

  async descendants(scope: ScopeRef): Promise<readonly ScopeEntry[]> {
    return scope.path === ROOT.path ? [ACME] : [];
  }
}

describe("ScopeTree", () => {
  it("is an abstract port", () => {
    expect(ScopeTree.prototype).toBeInstanceOf(Port);
  });

  it("is implemented by a driver that reads nodes, ancestors and descendants", async () => {
    const tree: ScopeTree = new ListScopeTreeDriver();
    await expect(tree.node(ACME.id)).resolves.toBe(ACME);
    await expect(tree.byPath("platform")).resolves.toBe(ROOT);
    await expect(tree.byPath("platform.other")).resolves.toBeUndefined();
    await expect(tree.ancestors(ACME)).resolves.toEqual([ROOT]);
    await expect(tree.descendants(ROOT)).resolves.toEqual([ACME]);
  });

  it("takes a scp public id", () => {
    expectTypeOf<Parameters<ScopeTree["node"]>[0]>().toEqualTypeOf<PublicId<"scp">>();
  });
});
