/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryScopeTreeDriver`: a `ScopeTree` that reads a node by id and by path, its ancestors root
 *          first and its descendants in path order (never the node itself, never a sibling whose label only starts
 *          the same), whatever order it was given the entries in; an unseeded tree reads every node from the source
 *          `readFrom` gives it (once), a seeded one keeps its list, and an unresolved source reads the list.
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

  it("reads every node from the source readFrom gives it, loading the source once", async () => {
    let loads = 0;
    const source = new MemoryScopeTreeDriver().seed([ROOT, ACME, ACME_EU]);
    const reader = new MemoryScopeTreeDriver().readFrom(async () => {
      loads += 1;
      return source;
    });

    await expect(reader.node(ACME.id)).resolves.toEqual(ACME);
    await expect(reader.byPath(ACME_EU.path)).resolves.toEqual(ACME_EU);
    await expect(reader.ancestors(ACME_EU)).resolves.toEqual([ROOT, ACME]);
    await expect(reader.descendants(ACME)).resolves.toEqual([ACME_EU]);
    expect(loads).toBe(1);
  });

  it("keeps a seeded list over a source, and reads the list when the source is undefined", async () => {
    const source = new MemoryScopeTreeDriver().seed([ACME]);
    const seeded = new MemoryScopeTreeDriver().seed([ROOT]).readFrom(async () => source);
    const unresolved = new MemoryScopeTreeDriver().readFrom(async () => undefined);

    await expect(seeded.node(ACME.id)).resolves.toBeUndefined();
    await expect(seeded.node(ROOT.id)).resolves.toEqual(ROOT);
    await expect(unresolved.node(ACME.id)).resolves.toBeUndefined();
  });
});
