/**
 * Stackra file contract:
 * Purpose: unit tests of the `Embedder` port: an abstract `Port` whose driver states its dimensions and returns one
 *          vector per text, in order.
 * Boundary: test only; a minimal driver stands in for a provider's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16); owner decision 23.
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Embedder } from "#contracts/ports/embedder.port";

/** Embeds a text as its length and its word count. */
class CountingEmbedderDriver extends Driver(Embedder) {
  readonly dimensions = 2;

  async embed(texts: readonly string[]): Promise<number[][]> {
    return texts.map((text) => [text.length, text.split(" ").length]);
  }
}

describe("Embedder", () => {
  it("is a port a driver extends, one vector per text", async () => {
    const embedder = new CountingEmbedderDriver();
    expect(embedder).toBeInstanceOf(Embedder);
    expect(embedder).toBeInstanceOf(Port);
    expect(embedder.dimensions).toBe(2);
    await expect(embedder.embed(["linen shirt", "hat"])).resolves.toEqual([
      [11, 2],
      [3, 1],
    ]);
  });
});
