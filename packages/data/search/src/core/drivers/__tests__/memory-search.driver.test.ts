/**
 * Stackra file contract:
 * Purpose: unit tests of `MemorySearchDriver`: a `SearchDriver` whose search requires every word, ranks a match in an
 *          earlier field higher, falls back to a match inside the text, applies exact filters, slices by offset and
 *          limit, keeps tables apart, replaces a re-indexed document and forgets a removed one, keeps a readied version beside the live index until its swap; facets count each
 *          matching document once per value, most frequent first, and refuse record visibility as a search does.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0221 (decisions 1 and 7); ADR 0266; ADR 0404; stackra-303 (versions);
 *                     stackra-326 (ranking rules, neighbours).
 */
import { describe, expect, it } from "@stackra/testing";

import { SearchDriver } from "#contracts/index";
import type { SearchFacetRequest, SearchRequest, SearchTable } from "#contracts/index";
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

describe("MemorySearchDriver alternatives and visibility", () => {
  it("matches a word by any of its alternatives", async () => {
    const driver = new MemorySearchDriver();
    await driver.index(PRODUCTS, [{ id: "prd_1", fields: ["حبيبي"], filters: {} }]);
    await expect(driver.search(PRODUCTS, request(["7abibi"]))).resolves.toEqual([]);
    await expect(
      driver.search(PRODUCTS, request(["7abibi"], { alternatives: { "7abibi": ["حبيبي"] } })),
    ).resolves.toEqual(["prd_1"]);
  });

  it("refuses a request that carries record visibility", async () => {
    await expect(
      new MemorySearchDriver().search(
        PRODUCTS,
        request(["x"], { visible: { sql: "select 1", params: [] } }),
      ),
    ).rejects.toThrow(/record visibility/);
  });

  it("counts the filter values of the matching documents, each once, most frequent first", async () => {
    const driver = await seeded();
    const facets = (words: string[], extra: Partial<SearchFacetRequest> = {}) =>
      driver.facets(PRODUCTS, {
        words,
        filters: {},
        paths: ["status", "collections.slug"],
        limit: 10,
        ...extra,
      });
    await expect(facets(["linen"])).resolves.toEqual({
      status: { active: 1, draft: 1 },
      "collections.slug": { sale: 1, summer: 1 },
    });
    await expect(facets([])).resolves.toEqual({
      status: { active: 2, draft: 1 },
      "collections.slug": { sale: 1, summer: 1 },
    });
    await expect(facets([], { filters: { status: "active" }, limit: 1 })).resolves.toEqual({
      status: { active: 2 },
      "collections.slug": {},
    });
  });

  it("refuses facets under record visibility", async () => {
    const driver = await seeded();
    await expect(
      driver.facets(PRODUCTS, {
        words: [],
        filters: {},
        paths: ["status"],
        limit: 10,
        visible: { sql: "select 1", params: [] },
      }),
    ).rejects.toThrow(TypeError);
  });
});

describe("MemorySearchDriver scopes", () => {
  it("answers only the documents within the request's scope paths, and unscoped ones", async () => {
    const driver = new MemorySearchDriver();
    await driver.index(PRODUCTS, [
      {
        id: "prd_a",
        fields: ["orbit lamp"],
        filters: { status: ["active"] },
        scope: { id: "scp_a", path: "platform.a" },
      },
      {
        id: "prd_ab",
        fields: ["orbit chair"],
        filters: { status: ["active"] },
        scope: { id: "scp_ab", path: "platform.ab" },
      },
      { id: "prd_global", fields: ["orbit poster"], filters: { status: ["draft"] } },
    ]);
    expect(
      await driver.search(PRODUCTS, request(["orbit"], { scopePaths: ["platform.a"] })),
    ).toEqual(["prd_a", "prd_global"]);
    expect(await driver.search(PRODUCTS, request(["orbit"], { scopePaths: [] }))).toEqual([
      "prd_global",
    ]);
    expect(
      await driver.facets(PRODUCTS, {
        words: ["orbit"],
        filters: {},
        paths: ["status"],
        limit: 10,
        scopePaths: ["platform.ab"],
      }),
    ).toEqual({ status: { active: 1, draft: 1 } });
  });
});

describe("MemorySearchDriver versions", () => {
  const V2: SearchTable = { ...PRODUCTS, version: 2 };

  it("rebuilds into a readied version while reads stay live, then swaps it live at once", async () => {
    const driver = await seeded();
    await driver.prepare(PRODUCTS, 2);
    expect(await driver.search(V2, request(["linen"]))).toEqual([]);
    await driver.index(V2, [{ id: "prd_9", fields: ["linen sheet"], filters: {} }]);
    expect(await driver.search(PRODUCTS, request(["linen"]))).toEqual(["prd_1", "prd_3"]);
    expect(await driver.search(V2, request(["linen"]))).toEqual(["prd_9"]);
    await driver.swap(PRODUCTS, 2);
    expect(await driver.search(PRODUCTS, request(["linen"]))).toEqual(["prd_9"]);
    await expect(driver.search(V2, request(["linen"]))).rejects.toThrow(TypeError);
  });

  it("writes and removes in the live index and the readied version alike during a rebuild", async () => {
    const driver = await seeded();
    await driver.prepare(PRODUCTS, 2);
    await driver.index(PRODUCTS, [{ id: "prd_7", fields: ["linen cap"], filters: {} }]);
    expect(await driver.search(V2, request(["cap"]))).toEqual(["prd_7"]);
    await driver.remove(PRODUCTS, ["prd_7"]);
    expect(await driver.search(V2, request(["cap"]))).toEqual([]);
    expect(await driver.search(PRODUCTS, request(["cap"]))).toEqual([]);
  });

  it("refuses a version that was not readied", async () => {
    const driver = await seeded();
    await expect(driver.swap(PRODUCTS, 3)).rejects.toThrow(TypeError);
    await expect(driver.index({ ...PRODUCTS, version: 3 }, [])).rejects.toThrow(TypeError);
  });
});

describe("MemorySearchDriver ranking rules and neighbours", () => {
  it("ranks pins first in order, drops hides, and scales scores by boosts and recency", async () => {
    const driver = await seeded();
    expect(driver.appliesRules).toBe(true);
    // prd_3 does not match "shirt" but passes no filter, so its pin still ranks it first.
    expect(
      await driver.search(
        PRODUCTS,
        request(["shirt"], { pinned: ["prd_3", "prd_2"], hidden: ["prd_1"] }),
      ),
    ).toEqual(["prd_3", "prd_2"]);
    expect(
      await driver.search(
        PRODUCTS,
        request(["shirt"], { pinned: ["prd_3"], filters: { status: "active" } }),
      ),
    ).toEqual(["prd_1", "prd_2"]);
    expect(
      await driver.search(
        PRODUCTS,
        request(["shirt"], { boosts: [{ path: "status", value: "active", factor: 0.1 }] }),
      ),
    ).toEqual(["prd_1", "prd_2"]);
    await driver.index(PRODUCTS, [
      { id: "prd_1", fields: ["linen shirt"], filters: { at: ["2000-01-01T00:00:00.000Z"] } },
      { id: "prd_2", fields: ["shirt"], filters: { at: [new Date().toISOString()] } },
    ]);
    expect(
      await driver.search(
        PRODUCTS,
        request(["shirt"], { recency: { path: "at", halfLifeDays: 30 } }),
      ),
    ).toEqual(["prd_2", "prd_1"]);
  });

  it("finds the closest stored words of other spellings", async () => {
    const driver = await seeded();
    expect(await driver.neighbours(PRODUCTS, { words: ["linnen", "linen"], limit: 2 })).toEqual({
      linnen: ["linen"],
    });
    await expect(
      driver.neighbours(PRODUCTS, {
        words: ["linnen"],
        limit: 2,
        visible: { sql: "x", params: [] },
      }),
    ).rejects.toThrow(TypeError);
  });
});
