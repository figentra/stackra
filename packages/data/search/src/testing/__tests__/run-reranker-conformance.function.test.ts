/**
 * Stackra file contract:
 * Purpose: unit tests of `runRerankerConformance`: the memory reranker passes it, and a driver that repeats a
 *          candidate, invents an id, ignores `topN` or accepts a topN of 0 is reported.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0089 (decision 5); ADR 0492 (decision 4).
 */
import { Driver } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { Reranker } from "#contracts/index";
import { MemoryRerankerDriver } from "#core/drivers/memory-reranker.driver";
import { runRerankerConformance } from "#testing/run-reranker-conformance.function";

/** A reranker that breaks every rule. */
class BrokenRerankerDriver extends Driver(Reranker) {
  readonly topN = 50;

  async rerank() {
    return [
      { id: "a", score: 1 },
      { id: "a", score: 2 },
      { id: "zzz", score: 3 },
    ];
  }
}

describe(runRerankerConformance, () => {
  it("passes the memory reranker", async () => {
    expect(await runRerankerConformance(() => new MemoryRerankerDriver())).toEqual([]);
  });

  it("reports each rule a driver misses", async () => {
    const mismatches = await runRerankerConformance(() => new BrokenRerankerDriver());
    expect(mismatches).toEqual(
      expect.arrayContaining([
        "returned a candidate twice",
        "returned an id it was not given",
        "did not return the best score first",
        "returned more than topN",
        "returned hits for no candidates",
        "accepted a topN of 0",
      ]),
    );
  });
});
