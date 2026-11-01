/**
 * Stackra file contract:
 * Purpose: unit tests of the `Reranker` port: an abstract `Port` whose driver states its `topN` and returns the best
 *          candidates with scores.
 * Boundary: test only; a minimal driver stands in for a real one.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0492 (decision 4).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Reranker } from "#contracts/ports/reranker.port";

/** Scores a candidate by its text length. */
class LengthRerankerDriver extends Driver(Reranker) {
  readonly topN = 50;

  async rerank(_query: string, candidates: readonly { id: string; text: string }[], topN: number) {
    return candidates
      .map((candidate) => ({ id: candidate.id, score: candidate.text.length }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
  }
}

describe("Reranker", () => {
  it("is a port a driver extends, best candidates first", async () => {
    const reranker = new LengthRerankerDriver();
    expect(reranker).toBeInstanceOf(Reranker);
    expect(reranker).toBeInstanceOf(Port);
    await expect(
      reranker.rerank(
        "q",
        [
          { id: "a", text: "x" },
          { id: "b", text: "xxx" },
        ],
        1,
      ),
    ).resolves.toEqual([{ id: "b", score: 3 }]);
  });
});
