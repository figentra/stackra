/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryScopeTreeDriver`: a `ScopeTree` that reads a node by id and by path, its ancestors root
 *          first and its descendants in path order (never the node itself, never a sibling whose label only starts
 *          the same), whatever order it was given the entries in.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0327 (decision 3); ADR 0266.
 */
import { describe, expect, it } from "@stackra/testing";

import { ScopeTree } from "#contracts/index";
import type { ScopeEntry } from "#contracts/index";
import { MemoryScopeTreeDriver } from "#core/drivers/memory-scope-tree.driver";

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
const ACME_EU: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w2",
  path: "platform.acme.eu",
  level: "store",
  name: "Acme EU",
};
const LOOKALIKE: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w3",
  path: "platform.acme_eu",
  level: "product",
  name: "Acme EU Ltd",
};

const tree = new MemoryScopeTreeDriver().seed([ACME_EU, LOOKALIKE, ROOT, ACME]);

describe(MemoryScopeTreeDriver, () => {
  it("is a ScopeTree", () => {
    expect(tree).toBeInstanceOf(ScopeTree);
  });

  it("reads a node by id and by path", async () => {
    await expect(tree.node(ACME.id)).resolves.toBe(ACME);
    await expect(tree.node("scp_01j9z3k4m5n6p7q8r9s0t1v2w9")).resolves.toBeUndefined();
    await expect(tree.byPath("platform.acme.eu")).resolves.toBe(ACME_EU);
    await expect(tree.byPath("platform.acme.us")).resolves.toBeUndefined();
  });

  it("reads the ancestors root first, without the node", async () => {
    await expect(tree.ancestors(ACME_EU)).resolves.toEqual([ROOT, ACME]);
    await expect(tree.ancestors(ROOT)).resolves.toEqual([]);
  });

  it("reads the descendants in path order, without the node or a lookalike sibling", async () => {
    await expect(tree.descendants(ROOT)).resolves.toEqual([ACME, ACME_EU, LOOKALIKE]);
    await expect(tree.descendants(ACME)).resolves.toEqual([ACME_EU]);
    await expect(tree.descendants(ACME_EU)).resolves.toEqual([]);
  });
});
