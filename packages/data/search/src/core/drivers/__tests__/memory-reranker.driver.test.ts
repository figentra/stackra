/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryRerankerDriver`: it is a `Reranker`, ranks by the share of the query's words a text holds
 *          (Arabic folded as the index folds it), keeps the given order on ties, cuts at `topN` and refuses a bad `topN`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266; ADR 0492 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { Reranker } from "#contracts/index";
import { MemoryRerankerDriver } from "#core/drivers/memory-reranker.driver";

describe(MemoryRerankerDriver, () => {
  it("is a Reranker with a window of 50", () => {
    expect(new MemoryRerankerDriver()).toBeInstanceOf(Reranker);
    expect(new MemoryRerankerDriver().topN).toBe(50);
  });

  it("ranks by the share of the query's words, ties in the order given", async () => {
    const hits = await new MemoryRerankerDriver().rerank(
      "linen shirt",
      [
        { id: "a", text: "wool coat" },
        { id: "b", text: "linen trousers" },
        { id: "c", text: "Linen shirt" },
        { id: "d", text: "cotton shirt" },
      ],
      3,
    );
    expect(hits).toEqual([
      { id: "c", score: 1 },
      { id: "b", score: 0.5 },
      { id: "d", score: 0.5 },
    ]);
  });

  it("folds Arabic as the index does", async () => {
    const hits = await new MemoryRerankerDriver().rerank(
      "اريكة",
      [
        { id: "a", text: "كنبة جلد" },
        { id: "b", text: "أريكة قماش" },
      ],
      2,
    );
    expect(hits[0]).toEqual({ id: "b", score: 1 });
  });

  it("refuses a topN that is not a whole number from 1", async () => {
    await expect(new MemoryRerankerDriver().rerank("x", [], 0)).rejects.toThrow(RangeError);
  });
});
