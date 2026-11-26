/**
 * Stackra file contract:
 * Purpose: unit tests of `SCOPE_TESTING_PLUGIN`: an app whose `ScopeTree` is the unseeded memory tree reads the nodes
 *          its `ScopeNodeService` holds (a root and a child added there are found by id, by path with their level, and
 *          along the path); a seeded tree keeps its own list; an app with no `ScopeNodeService` keeps the empty tree.
 * Boundary: test only; the app is a minimal `TestingApp` and the service a store-backed `ScopeNodeService`, so the test
 *           proves the plugin's wiring, not the node table's SQL (the service's own tests cover that).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0327 (decisions 1 and 3).
 */
import type { AnyClass } from "@stackra/container";
import type { TestingApp } from "@stackra/container/testing";
import type { PublicId, ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ScopeTree } from "#contracts/index";
import { MemoryScopeTreeDriver } from "#core/index";
import { ScopeNode } from "#node/models/scope-node.model";
import { ScopeNodeService } from "#node/services/scope-node.service";
import { SCOPE_TESTING_PLUGIN } from "#testing/constants/scope-testing-plugin.constant";
import { fakeScopeTree } from "#testing/functions/fake-scope-tree.function";

const ROOT_ID = "scp_01j9z3k4m5n6p7q8r9s0t1v2w0" as PublicId<"scp">;
const CHILD_ID = "scp_01j9z3k4m5n6p7q8r9s0t1v2w1" as PublicId<"scp">;

/** A `ScopeNodeService` over an in-process list: `add` stores a node, the reads answer from the list. */
function nodeService(): ScopeNodeService & {
  add: (id: string, path: string, level: string) => void;
} {
  const rows: ScopeNode[] = [];
  const service = Object.create(ScopeNodeService.prototype) as ScopeNodeService & {
    add: (id: string, path: string, level: string) => void;
  };
  return Object.assign(service, {
    add: (id: string, path: string, level: string) => {
      rows.push(Object.assign(new ScopeNode(), { id, scopePath: path, level, name: path }));
    },
    findOne: async ({ id, scopePath }: { id?: string; scopePath?: string }) =>
      rows.find((row) => (id !== undefined ? row.id === id : row.scopePath === scopePath)) ?? null,
    ancestorsOf: async (scope: ScopeRef) =>
      rows.filter((row) => scope.path.startsWith(`${row.scopePath}.`)),
    descendantsOf: async (scope: ScopeRef) =>
      rows.filter((row) => row.scopePath.startsWith(`${scope.path}.`)),
  });
}

/** A testing app that binds `tree` as the `ScopeTree` and, when given, `nodes`. */
function appOf(tree: ScopeTree, nodes?: ScopeNodeService): TestingApp {
  const bound = (token: AnyClass): object | undefined =>
    token === ScopeTree ? tree : token === ScopeNodeService ? nodes : undefined;
  return {
    has: (token: AnyClass) => bound(token) !== undefined,
    get: (token: AnyClass) => bound(token),
  } as unknown as TestingApp;
}

describe("SCOPE_TESTING_PLUGIN", () => {
  it("is the @stackra/scope plugin", () => {
    expect(SCOPE_TESTING_PLUGIN.name).toBe("@stackra/scope");
  });

  it("points the memory tree at the nodes ScopeNodeService holds", async () => {
    const nodes = nodeService();
    const tree = new MemoryScopeTreeDriver();
    SCOPE_TESTING_PLUGIN.app?.(appOf(tree, nodes));
    nodes.add(ROOT_ID, "platform", "platform");
    nodes.add(CHILD_ID, "platform.acme", "product");

    await expect(tree.node(CHILD_ID)).resolves.toMatchObject({
      id: CHILD_ID,
      path: "platform.acme",
      level: "product",
    });
    await expect(tree.byPath("platform.acme")).resolves.toMatchObject({ level: "product" });
    await expect(tree.ancestors({ id: CHILD_ID, path: "platform.acme" })).resolves.toEqual([
      { id: ROOT_ID, path: "platform", level: "platform", name: "platform" },
    ]);
    await expect(tree.descendants({ id: ROOT_ID, path: "platform" })).resolves.toHaveLength(1);
  });

  it("leaves a seeded tree on its own list", async () => {
    const nodes = nodeService();
    nodes.add(CHILD_ID, "platform.acme", "product");
    const tree = fakeScopeTree(["platform.beta"]);
    SCOPE_TESTING_PLUGIN.app?.(appOf(tree, nodes));

    await expect(tree.byPath("platform.acme")).resolves.toBeUndefined();
    await expect(tree.byPath("platform.beta")).resolves.toMatchObject({ path: "platform.beta" });
  });

  it("keeps the empty memory tree when the app binds no ScopeNodeService", async () => {
    const tree = new MemoryScopeTreeDriver();
    SCOPE_TESTING_PLUGIN.app?.(appOf(tree));

    await expect(tree.node(CHILD_ID)).resolves.toBeUndefined();
  });
});
