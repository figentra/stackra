/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryVectorIndexDriver`: a `VectorIndex` that ranks by cosine similarity with ties by id,
 *          keeps a query to the items at or below its scope node, filters by metadata equality, cuts at `topK`,
 *          replaces an item stored again, forgets a removed one, and refuses a bad vector, a bad `topK` and vectors of
 *          different lengths.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266; owner decision 23.
 */
import type { ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { VectorIndex } from "#contracts/index";
import type { VectorItem } from "#contracts/index";
import { MemoryVectorIndexDriver } from "#core/drivers/memory-vector-index.driver";

const ACME: ScopeRef = { id: "scp_01jab3k4m5n6p7q8r9s0t1v2w3", path: "acme" };

const ACME_SHOP: ScopeRef = { id: "scp_01jab3k4m5n6p7q8r9s0t1v2w4", path: "acme.shop" };

const ACMEX: ScopeRef = { id: "scp_01jab3k4m5n6p7q8r9s0t1v2w5", path: "acmex" };

/** An item of `scope` with `vector`. */
const item = (
  id: string,
  scope: ScopeRef,
  vector: number[],
  metadata: VectorItem["metadata"] = {},
): VectorItem => ({ id, scope, vector, text: `text of ${id}`, metadata });

/** A driver holding four items across three scopes. */
async function seeded(): Promise<MemoryVectorIndexDriver> {
  const index = new MemoryVectorIndexDriver();
  await index.upsert([
    item("a", ACME, [1, 0], { locale: "en" }),
    item("b", ACME_SHOP, [0.6, 0.8], { locale: "ar" }),
    item("c", ACME, [0, 1], { locale: "en" }),
    item("d", ACMEX, [1, 0]),
  ]);
  return index;
}

describe(MemoryVectorIndexDriver, () => {
  it("is a VectorIndex", () => {
    expect(new MemoryVectorIndexDriver()).toBeInstanceOf(VectorIndex);
  });

  it("ranks by cosine similarity within the scope and its descendants", async () => {
    const index = await seeded();
    const hits = await index.query([1, 0], { topK: 10, scope: ACME });
    expect(hits.map((hit) => hit.id)).toEqual(["a", "b", "c"]);
    expect(hits[0]).toEqual({ id: "a", score: 1, text: "text of a", metadata: { locale: "en" } });
    expect(hits[1]?.score).toBeCloseTo(0.6);
    expect(hits[2]?.score).toBe(0);
  });

  it("keeps a child scope's query to its own subtree", async () => {
    const index = await seeded();
    const hits = await index.query([1, 0], { topK: 10, scope: ACME_SHOP });
    expect(hits.map((hit) => hit.id)).toEqual(["b"]);
  });

  it("filters by metadata equality and cuts at topK", async () => {
    const index = await seeded();
    const filtered = await index.query([1, 0], { topK: 10, scope: ACME, filter: { locale: "en" } });
    expect(filtered.map((hit) => hit.id)).toEqual(["a", "c"]);
    const top = await index.query([1, 0], { topK: 1, scope: ACME });
    expect(top.map((hit) => hit.id)).toEqual(["a"]);
  });

  it("breaks ties by id and scores a zero vector 0", async () => {
    const index = new MemoryVectorIndexDriver();
    await index.upsert([item("y", ACME, [2, 0]), item("x", ACME, [1, 0]), item("z", ACME, [0, 0])]);
    const hits = await index.query([1, 0], { topK: 3, scope: ACME });
    expect(hits.map((hit) => [hit.id, hit.score])).toEqual([
      ["x", 1],
      ["y", 1],
      ["z", 0],
    ]);
  });

  it("replaces an item stored again and forgets a removed one", async () => {
    const index = await seeded();
    await index.upsert([item("c", ACME, [1, 0])]);
    await index.remove(["a", "unknown"]);
    const hits = await index.query([1, 0], { topK: 10, scope: ACME });
    expect(hits.map((hit) => hit.id)).toEqual(["c", "b"]);
  });

  it("refuses a bad vector, a bad topK and vectors of different lengths", async () => {
    const index = await seeded();
    await expect(index.upsert([item("e", ACME, [])])).rejects.toThrow(TypeError);
    await expect(index.query([Number.NaN, 0], { topK: 1, scope: ACME })).rejects.toThrow(TypeError);
    await expect(index.query([1, 0], { topK: 0, scope: ACME })).rejects.toThrow(TypeError);
    await expect(index.query([1, 0], { topK: 1.5, scope: ACME })).rejects.toThrow(TypeError);
    await expect(index.query([1, 0, 0], { topK: 1, scope: ACME })).rejects.toThrow(TypeError);
  });
});
