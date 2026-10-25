/**
 * Stackra file contract:
 * Purpose: unit tests of `retrieve`: the query is embedded once and sent to the index with the top-k and the caller's
 *          scope, hits become passages (the `source` metadata, else the id), a blank query and an empty embedding are
 *          refused before the index is asked, and the passages fit a `Facts` result.
 * Boundary: test only; the `Embedder` and `VectorIndex` ports are faked in the test and record what they are given.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0245 (decision 3).
 */
import type { ScopeRef } from "@stackra/contracts";
import { Embedder, VectorIndex } from "@stackra/search/contracts";
import type { VectorHit, VectorQueryOptions } from "@stackra/search/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { retrieve } from "#core/functions/retrieve.function";
import type { ContextFacts } from "#core/types/context-facts.type";
import type { RetrievedPassage } from "#core/types/retrieved-passage.type";

// reason: a branded public id is not worth minting for a fake; the helper only passes the scope through
const scope = { id: "scp_1", path: "root.shop" } as unknown as ScopeRef;

/** An embedder that records its calls and answers `vector` for every text. */
class FakeEmbedder extends Embedder {
  readonly dimensions = 2;

  readonly calls: (readonly string[])[] = [];

  private readonly vector: number[];

  constructor(vector: number[]) {
    super();
    this.vector = vector;
  }

  async embed(texts: readonly string[]): Promise<number[][]> {
    this.calls.push(texts);
    return texts.map(() => this.vector);
  }
}

/** An index that records its queries and answers `hits`. */
class FakeIndex extends VectorIndex {
  readonly queries: { vector: readonly number[]; options: VectorQueryOptions }[] = [];

  private readonly hits: readonly VectorHit[];

  constructor(hits: readonly VectorHit[]) {
    super();
    this.hits = hits;
  }

  async upsert(): Promise<void> {}

  async query(vector: readonly number[], options: VectorQueryOptions) {
    this.queries.push({ vector, options });
    return this.hits;
  }

  async remove(): Promise<void> {}
}

describe("retrieve", () => {
  it("embeds the query, asks the index in the scope and returns passages", async () => {
    const embedder = new FakeEmbedder([0.1, 0.9]);
    const index = new FakeIndex([
      { id: "doc_1#0", score: 0.92, text: "Returns take 14 days.", metadata: { source: "doc_1" } },
      { id: "doc_2#3", score: 0.5, text: "Shipping is free.", metadata: { locale: "en" } },
    ]);

    const passages = await retrieve("return policy", { index, embedder, topK: 2, scope });

    expect(embedder.calls).toEqual([["return policy"]]);
    expect(index.queries).toEqual([{ vector: [0.1, 0.9], options: { topK: 2, scope } }]);
    expect(passages).toEqual([
      { text: "Returns take 14 days.", source: "doc_1", score: 0.92 },
      { text: "Shipping is free.", source: "doc_2#3", score: 0.5 },
    ]);
  });

  it("refuses a blank query and an empty embedding without asking the index", async () => {
    const index = new FakeIndex([]);

    await expect(
      retrieve("  ", { index, embedder: new FakeEmbedder([1, 0]), topK: 1, scope }),
    ).rejects.toThrow(RangeError);
    await expect(
      retrieve("q", { index, embedder: new FakeEmbedder([]), topK: 1, scope }),
    ).rejects.toThrow(RangeError);
    expect(index.queries).toEqual([]);
  });

  it("returns what a Facts subclass can put under facts", async () => {
    const passages = await retrieve("q", {
      index: new FakeIndex([]),
      embedder: new FakeEmbedder([1, 0]),
      topK: 1,
      scope,
    });
    const facts: ContextFacts = { summary: "No passages match.", facts: { passages } };

    expect(facts.facts["passages"]).toEqual([]);
    expectTypeOf(passages).toEqualTypeOf<readonly RetrievedPassage[]>();
  });
});
