/**
 * Stackra file contract:
 * Purpose: unit tests of `SearchIndex`'s reranking, data synonyms and Arabic locale: a read that asks for reranking (or
 *          whose facet declares `rerank`) orders by the reranker from the rows' raw text, pages from that order, keeps
 *          fused order with no reranker bound, with `rerank: false` or when the reranker fails; a tenant's data synonym
 *          sets expand a phrase like the setting's, in the read's language; in an Arabic locale any Latin word gets its
 *          Arabizi alternative, and in no other locale or with the switch off it does not.
 * Boundary: test only; the memory driver ranks and a stand-in entity manager answers metadata, populate and find from a
 *           fixed list, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0492 (decisions 4 and 5); ADR 0221.
 */
import { Driver } from "@stackra/container";
import type { Database } from "@stackra/database";
import { Model, Searchable } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { Reranker } from "#contracts/index";
import type { RerankCandidate } from "#contracts/index";
import { MemorySearchDriver } from "#core/drivers/memory-search.driver";
import { MemorySynonymSourceDriver } from "#core/drivers/memory-synonym-source.driver";
import { SearchIndex } from "#core/values/search-index.value";

@Searchable({ text: ["title"] })
class Product extends Model.with() {
  id = "";

  title = "";
}

@Searchable({
  text: ["title"],
  rerank: true,
})
class Listing extends Model.with() {
  id = "";

  title = "";
}

/** The rows of both models. */
const PRODUCTS = [
  Object.assign(new Product(), { id: "prd_1", title: "Linen Shirt" }),
  Object.assign(new Product(), { id: "prd_2", title: "Shirt Dress" }),
  Object.assign(new Product(), { id: "prd_3", title: "Linen Shirt Kids" }),
];

const LISTINGS = [
  Object.assign(new Listing(), { id: "lst_1", title: "Linen Shirt" }),
  Object.assign(new Listing(), { id: "lst_2", title: "Shirt Dress" }),
];

/** A database whose entity manager reads `rows` by primary key. */
function databaseOver(rows: readonly { readonly id: string }[]): Database {
  const em = {
    getMetadata: () => ({
      schema: "catalogue",
      tableName: "products",
      primaryKeys: ["id"],
      properties: { id: { kind: "scalar", fieldNames: ["id"] } },
    }),
    populate: async () => undefined,
    execute: async () => [{ paths: null }],
    find: async (_model: unknown, where: { id?: { $in?: readonly string[] } }) =>
      rows.filter((row) => where.id?.$in?.includes(row.id) ?? true),
  };
  return { em: () => em } as unknown as Database;
}

/** A reranker that puts the candidates in reverse order, recording what it was asked. */
class ReversingRerankerDriver extends Driver(Reranker) {
  readonly topN = 50;

  readonly seen: { query: string; candidates: readonly RerankCandidate[] }[] = [];

  async rerank(query: string, candidates: readonly RerankCandidate[], topN: number) {
    this.seen.push({ query, candidates });
    return [...candidates]
      .reverse()
      .slice(0, topN)
      .map((candidate, at) => ({ id: candidate.id, score: 1 - at / 10 }));
  }
}

/** A reranker that always fails. */
class FailingRerankerDriver extends Driver(Reranker) {
  readonly topN = 50;

  async rerank(): Promise<never> {
    throw new Error("the reranker is down");
  }
}

/** A product index over the memory driver, with the optional collaborators. */
async function productsWith(reranker?: Reranker, synonyms?: MemorySynonymSourceDriver) {
  const driver = new MemorySearchDriver();
  const products = new SearchIndex(
    driver,
    databaseOver(PRODUCTS),
    Product,
    undefined,
    undefined,
    reranker,
    synonyms,
  );
  await products.index(PRODUCTS);
  return { driver, products };
}

describe("SearchIndex reranking", () => {
  it("puts the fused candidates in the reranker's order when the read asks, from their raw text", async () => {
    const reranker = new ReversingRerankerDriver();
    const { products } = await productsWith(reranker);
    const fused = await products.find("shirt", { limit: 5 });
    expect(reranker.seen).toEqual([]);
    expect(await products.find("shirt", { limit: 5, rerank: true })).toEqual([...fused].reverse());
    expect(reranker.seen[0]?.query).toBe("shirt");
    expect(reranker.seen[0]?.candidates.map((candidate) => candidate.text)).toContain(
      "Linen Shirt",
    );
  });

  it("pages from the reranked order without repeating or losing a row", async () => {
    const { products } = await productsWith(new ReversingRerankerDriver());
    const first = await products.page("shirt", { limit: 2, rerank: true });
    expect(first.hasMore).toBe(true);
    const second = await products.page("shirt", {
      limit: 2,
      rerank: true,
      cursor: first.nextCursor,
    });
    expect(new Set([...first.items, ...second.items]).size).toBe(3);
  });

  it("follows the facet's rerank, and rerank: false turns it off", async () => {
    const reranker = new ReversingRerankerDriver();
    const listings = new SearchIndex(
      new MemorySearchDriver(),
      databaseOver(LISTINGS),
      Listing,
      undefined,
      undefined,
      reranker,
    );
    await listings.index(LISTINGS);
    const reranked = await listings.find("shirt");
    expect(reranker.seen).toHaveLength(1);
    expect(await listings.find("shirt", { rerank: false })).toEqual([...reranked].reverse());
    expect(reranker.seen).toHaveLength(1);
  });

  it("keeps fused order with no reranker bound or when the reranker fails", async () => {
    const { products: plain } = await productsWith();
    const { products: failing } = await productsWith(new FailingRerankerDriver());
    const fused = await plain.find("shirt", { limit: 5 });
    expect(await plain.find("shirt", { limit: 5, rerank: true })).toEqual(fused);
    expect(await failing.find("shirt", { limit: 5, rerank: true })).toEqual(fused);
  });
});

describe("SearchIndex data synonyms and Arabic locale", () => {
  it("adds the tenant's data synonym sets, in the read's language", async () => {
    const source = new MemorySynonymSourceDriver().seed([
      { index: "products", language: "en", terms: ["tunic", "shirt"] },
      { index: "products", language: "ar", terms: ["flax", "linen"] },
    ]);
    const { products } = await productsWith(undefined, source);
    expect(await products.find("tunic", { locale: "en" })).toEqual(PRODUCTS);
    expect(await products.find("flax", { locale: "en" })).toEqual([]);
    expect(await products.find("flax", { locale: "ar-SA" })).toEqual([PRODUCTS[0], PRODUCTS[2]]);
  });

  it("gives any Latin word its Arabizi spelling in an Arabic locale only", async () => {
    const { driver, products } = await productsWith();
    const search = vi.spyOn(driver, "search");
    await products.find("shirt", { locale: "ar-SA" });
    await products.find("shirt", { locale: "en" });
    await products.find("shirt", { locale: "ar", arabizi: false });
    expect(search.mock.calls.map((call) => call[1].alternatives)).toEqual([
      { shirt: ["شيرت"] },
      undefined,
      undefined,
    ]);
  });
});
