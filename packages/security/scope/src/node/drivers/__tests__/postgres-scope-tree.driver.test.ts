/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresScopeTreeDriver`: a `ScopeTree` that reads through `ScopeNodeService` by id, by path,
 *          and along the path, and hands each row on as a `ScopeEntry` (`undefined` for no row).
 * Boundary: test only; the service is a stand-in over a fixed list, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0327 (decisions 1, 3 and 9).
 */
import type { ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ScopeTree } from "#contracts/index";
import { PostgresScopeTreeDriver } from "#node/drivers/postgres-scope-tree.driver";
import { ScopeNode } from "#node/models/scope-node.model";
import type { ScopeNodeService } from "#node/services/scope-node.service";

/** A stored node. */
const nodeAt = (id: ScopeRef["id"], path: string, level: string, name: string): ScopeNode =>
  Object.assign(new ScopeNode(), { id, scopePath: path, level, name });

const ROOT = nodeAt("scp_01j9z3k4m5n6p7q8r9s0t1v2w0", "platform", "platform", "Platform");
const ACME = nodeAt("scp_01j9z3k4m5n6p7q8r9s0t1v2w1", "platform.acme", "product", "Acme");

/** The three reads the driver makes, answered from the two nodes. */
const nodes = {
  findOne: async ({ id, scopePath }: { id?: string; scopePath?: string }) =>
    [ROOT, ACME].find((node) => node.id === id || node.scopePath === scopePath) ?? null,
  ancestorsOf: async (scope: ScopeRef) => (scope.path === ACME.scopePath ? [ROOT] : []),
  descendantsOf: async (scope: ScopeRef) => (scope.path === ROOT.scopePath ? [ACME] : []),
} as unknown as ScopeNodeService;

const tree = new PostgresScopeTreeDriver(nodes);

const ACME_ENTRY = { id: ACME.id, path: "platform.acme", level: "product", name: "Acme" };

describe(PostgresScopeTreeDriver, () => {
  it("is a ScopeTree", () => {
    expect(tree).toBeInstanceOf(ScopeTree);
  });

  it("reads a node by id and by path as an entry", async () => {
    await expect(tree.node(ACME.id)).resolves.toEqual(ACME_ENTRY);
    await expect(tree.byPath("platform.acme")).resolves.toEqual(ACME_ENTRY);
    await expect(tree.node("scp_01j9z3k4m5n6p7q8r9s0t1v2w9")).resolves.toBeUndefined();
    await expect(tree.byPath("platform.other")).resolves.toBeUndefined();
  });

  it("reads the ancestors and the descendants as entries", async () => {
    await expect(tree.ancestors(ACME_ENTRY)).resolves.toEqual([
      { id: ROOT.id, path: "platform", level: "platform", name: "Platform" },
    ]);
    await expect(tree.descendants({ id: ROOT.id, path: "platform" })).resolves.toEqual([
      ACME_ENTRY,
    ]);
  });
});
