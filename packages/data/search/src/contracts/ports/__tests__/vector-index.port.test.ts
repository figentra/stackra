/**
 * Stackra file contract:
 * Purpose: unit tests of the `VectorIndex` port: an abstract `Port`, so a driver extending it is a `VectorIndex` to
 *          every consumer and answers through the three members.
 * Boundary: test only; a minimal driver stands in for the real ones.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16); owner decision 23.
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { VectorIndex } from "#contracts/ports/vector-index.port";
import type { VectorHit } from "#contracts/types/vector-hit.type";

/** Answers every query with one hit whose score is the query's first number. */
class EchoVectorIndexDriver extends Driver(VectorIndex) {
  async upsert(): Promise<void> {}

  async query(vector: readonly number[], _options: unknown): Promise<readonly VectorHit[]> {
    return [{ id: "echo", score: vector[0] ?? 0, text: "", metadata: {} }];
  }

  async remove(): Promise<void> {}
}

describe("VectorIndex", () => {
  it("is a port a driver extends", async () => {
    const driver = new EchoVectorIndexDriver();
    expect(driver).toBeInstanceOf(VectorIndex);
    expect(driver).toBeInstanceOf(Port);
    await expect(
      driver.query([0.5], {
        topK: 1,
        scope: { id: "scp_01jab3k4m5n6p7q8r9s0t1v2w3", path: "acme" },
      }),
    ).resolves.toEqual([{ id: "echo", score: 0.5, text: "", metadata: {} }]);
  });
});
