/**
 * Stackra file contract:
 * Purpose: unit tests of `MemorySearchDriver`: a `SearchDriver` whose search requires every word, ranks a match in an
 *          earlier field higher, falls back to a match inside the text, applies exact filters, slices by offset and
 *          limit, keeps tables apart, replaces a re-indexed document and forgets a removed one.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0221 (decisions 1 and 7); ADR 0266.
 */
import { describe, expect, it } from "@stackra/testing";

import { SearchDriver } from "#contracts/index";
import type { SearchRequest, SearchTable } from "#contracts/index";
import { MemorySearchDriver } from "#core/drivers/memory-search.driver";

const PRODUCTS: SearchTable = { schema: "catalogue", table: "products", primaryKey: "id" };

const ORDERS: SearchTable = { schema: "orders", table: "orders", primaryKey: "id" };

/** A request for `words` with no filter and room for ten ids. */
const request = (words: string[], extra: Partial<SearchRequest> = {}): SearchRequest => ({
  words,
  filters: {},
  offset: 0,
  limit: 10,
  ...extra,
});

/** A driver holding three products. */
async function seeded(): Promise<MemorySearchDriver> {
  const driver = new MemorySearchDriver();
  await driver.index(PRODUCTS, [
    { id: "prd_1", fields: ["linen shirt", "ab 1234"], filters: { status: ["active"] } },
    { id: "prd_2", fields: ["cotton tee", "shirt 9"], filters: { status: ["active"] } },
    {
      id: "prd_3",
      fields: [{ en: "linen trousers", ar: "بنطال كتان" }, "cd 5678"],
      filters: { status: ["draft"], "collections.slug": ["summer", "sale"] },
    },
  ]);
  return driver;
}

describe(MemorySearchDriver, () => {
  it("is a SearchDriver", () => {
    expect(new MemorySearchDriver()).toBeInstanceOf(SearchDriver);
  });

  it("ranks an earlier field higher and requires every word", async () => {
    const driver = await seeded();
    await expect(driver.search(PRODUCTS, request(["shirt"]))).resolves.toEqual(["prd_1", "prd_2"]);
    await expect(driver.search(PRODUCTS, request(["lin", "shirt"]))).resolves.toEqual(["prd_1"]);
    await expect(driver.search(PRODUCTS, request(["كتان"]))).resolves.toEqual(["prd_3"]);
  });

  it("falls back to a match inside the text", async () => {
    const driver = await seeded();
    await expect(driver.search(PRODUCTS, request(["234"]))).resolves.toEqual(["prd_1"]);
  });

  it("applies exact filters, including one of several values", async () => {
    const driver = await seeded();
    await expect(
      driver.search(PRODUCTS, request(["linen"], { filters: { status: "active" } })),
    ).resolves.toEqual(["prd_1"]);
    await expect(
      driver.search(PRODUCTS, request(["linen"], { filters: { "collections.slug": "sale" } })),
    ).resolves.toEqual(["prd_3"]);
    await expect(
      driver.search(PRODUCTS, request(["linen"], { filters: { brand: "acme" } })),
    ).resolves.toEqual([]);
  });

  it("slices the ranked ids by offset and limit, ties by id", async () => {
    const driver = await seeded();
    await expect(driver.search(PRODUCTS, request(["linen"], { limit: 1 }))).resolves.toEqual([
      "prd_1",
    ]);
    await expect(
      driver.search(PRODUCTS, request(["linen"], { offset: 1, limit: 1 })),
    ).resolves.toEqual(["prd_3"]);
  });

  it("keeps tables apart, replaces a document and forgets a removed one", async () => {
    const driver = await seeded();
    await expect(driver.search(ORDERS, request(["linen"]))).resolves.toEqual([]);
    await driver.index(PRODUCTS, [{ id: "prd_1", fields: ["wool scarf"], filters: {} }]);
    await expect(driver.search(PRODUCTS, request(["shirt"]))).resolves.toEqual(["prd_2"]);
    await driver.remove(PRODUCTS, ["prd_2", "prd_9"]);
    await expect(driver.search(PRODUCTS, request(["shirt"]))).resolves.toEqual([]);
    await driver.remove(ORDERS, ["ord_1"]);
  });
});
