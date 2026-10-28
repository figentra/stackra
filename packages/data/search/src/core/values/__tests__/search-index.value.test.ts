/**
 * Stackra file contract:
 * Purpose: unit tests of `SearchIndex`: indexing loads the facet's relations and stores normalised documents under the
 *          model's table; `find` and `page` return loaded rows in rank order with the next cursor; filters, limits and
 *          cursors are checked; a phrase with no word reads nothing; `remove` and `reindex` reach the driver; an Arabizi word
 *          carries its Arabic alternative unless the read turns Arabizi off (STA-1251), a word of one of the index's synonym sets (settings data, per language)
 *          finds the rows of the other words, record visibility reaches the driver before ranking and before facet
 *          counting, facets count filter values over the matches (or every row for an empty phrase), and a privileged
 *          field is excerpted only for the record's team; a document carries its row's scope, and a read on an engine
 *          that does not isolate scopes carries the session's granted paths (none outside a scope session, none at all
 *          when the session holds an empty grant), while one on an engine that does carries none; `similar` embeds the folded
 *          phrase and reads by the vector lane alone, a find given an embedder on a semantic index and a fusing driver
 *          carries the vector, and `similar` refuses a non-semantic model or a driver without the lane; `prepare`,
 *          `reindex({ version })` and `swap` rebuild into a version and swap it live, refusing a version outside 2 to 999.
 * Boundary: test only; the memory driver ranks and a stand-in entity manager answers metadata, populate and find from
 *           a fixed list, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0221 (decisions 1 to 3 and 7); ADR 0404; stackra-301; stackra-303.
 */
import { connectVisibilityFilter, Database as DatabasePort } from "@stackra/database";
import type { Database } from "@stackra/database";
import { VisibilityFilter } from "@stackra/database/contracts";
import { isRefusal } from "@stackra/errors";
import { Classify, Model, PrivilegedDataClass, Searchable } from "@stackra/model";
import { MemorySettingValueStoreDriver, SettingsReader } from "@stackra/settings";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import type { Embedder } from "#contracts/index";
import { MemorySearchDriver } from "#core/drivers/memory-search.driver";
import { SearchCursorInvalidError } from "#core/errors/search-cursor-invalid.error";
import { SearchIndex } from "#core/values/search-index.value";

@Searchable({
  text: ["title", "variants.sku"],
  filters: ["status"],
})
class Product extends Model.with() {
  id = "";

  title = "";

  status = "draft";

  variants: readonly { readonly sku: string }[] = [];
}

class Note extends Model.with() {}

/** A product with the given fields. */
const productWith = (fields: Partial<Product>): Product => Object.assign(new Product(), fields);

const ROWS = [
  productWith({ id: "prd_1", title: "Linen Shirt", status: "active", variants: [{ sku: "AB-1" }] }),
  productWith({ id: "prd_2", title: "Shirt Dress", status: "active" }),
  productWith({ id: "prd_3", title: "Linen Shirt Kids", status: "draft" }),
];

/** The metadata the stand-in entity manager reports for `Product`. */
const META = {
  schema: "catalogue",
  tableName: "products",
  primaryKeys: ["id"],
  properties: {
    id: { kind: "scalar", fieldNames: ["id"] },
    variants: { kind: "1:m", fieldNames: [] },
  },
};

/** A primary key filter as the index writes it. */
type KeyFilter = { readonly id?: { readonly $in?: readonly string[]; readonly $gt?: string } };

/** A database whose entity manager reads `rows` in a session granted `scopePaths`, with the populate calls recorded. */
function databaseOver(rows: readonly Product[], scopePaths: string | null = null) {
  const populate = vi.fn(async (_rows: readonly Product[], _hints: readonly string[]) => undefined);
  const em = {
    getMetadata: () => META,
    populate,
    execute: async () => [{ paths: scopePaths }],
    find: async (_model: unknown, where: KeyFilter, options: { readonly limit?: number } = {}) => {
      const { $in, $gt } = where.id ?? {};
      const found = rows
        .filter(
          (row) =>
            ($in === undefined || $in.includes(row.id)) && ($gt === undefined || row.id > $gt),
        )
        .sort((a, b) => (a.id < b.id ? -1 : 1));
      return options.limit === undefined ? found : found.slice(0, options.limit);
    },
  };
  return { database: { em: () => em } as unknown as Database, populate };
}

/** An indexed product search over the three rows. */
async function indexed() {
  const driver = new MemorySearchDriver();
  const { database, populate } = databaseOver(ROWS);
  const products = new SearchIndex(driver, database, Product);
  await products.index(ROWS);
  return { driver, products, populate };
}

describe(SearchIndex, () => {
  it("adds the index's synonym sets in the read's language as alternatives, for finds and facets", async () => {
    const driver = new MemorySearchDriver();
    const { database } = databaseOver(ROWS);
    const settings = new SettingsReader(
      new MemorySettingValueStoreDriver().seed("search", {
        synonyms:
          "products en: tunic, shirt\ncatalogue.products ar: flax, linen\narticles en: frock, dress",
      }),
    );
    const products = new SearchIndex(driver, database, Product, settings);
    await products.index(ROWS);
    expect(await products.find("tunic", { limit: 5 })).toEqual([ROWS[0], ROWS[1], ROWS[2]]);
    expect(await products.find("flax", { locale: "ar-SA" })).toEqual([ROWS[0], ROWS[2]]);
    expect(await products.find("flax", { locale: "en" })).toEqual([]);
    expect(await products.find("frock")).toEqual([]);
    expect(await products.facets("flax", { paths: ["status"], locale: "ar" })).toEqual({
      status: { active: 1, draft: 1 },
    });
    const search = vi.spyOn(driver, "search");
    await products.find("7abibi tunic");
    expect(search.mock.calls[0]?.[1].alternatives).toEqual({
      "7abibi": ["حبيبي"],
      tunic: ["shirt"],
    });
  });

  it("stores the row's scope and reads only the session's scopes on an engine outside the database", async () => {
    const scoped = [
      productWith({ id: "prd_a", title: "Orbit Lamp", status: "active" }),
      productWith({ id: "prd_b", title: "Orbit Desk", status: "draft" }),
    ];
    Object.assign(scoped[0] ?? {}, { scopeId: "scp_a", scopePath: "platform.a" });
    Object.assign(scoped[1] ?? {}, { scopeId: "scp_b", scopePath: "platform.b" });
    const driver = new MemorySearchDriver();
    const index = vi.spyOn(driver, "index");
    const { database } = databaseOver(scoped, "platform.a");
    const products = new SearchIndex(driver, database, Product);
    await products.index(scoped);
    expect(index.mock.calls[0]?.[1][0]?.scope).toEqual({ id: "scp_a", path: "platform.a" });
    expect(await products.find("orbit")).toEqual([scoped[0]]);
    expect(await products.facets("orbit", { paths: ["status"] })).toEqual({
      status: { active: 1 },
    });
    const none = new SearchIndex(driver, databaseOver(scoped, "").database, Product);
    expect(await none.find("orbit")).toEqual([]);
  });

  it("passes no scope paths to an engine that isolates scopes in the database", async () => {
    class IsolatingDriver extends MemorySearchDriver {
      override readonly isolatesScopes = true;
    }
    const driver = new IsolatingDriver();
    const search = vi.spyOn(driver, "search");
    const products = new SearchIndex(driver, databaseOver(ROWS, "platform.a").database, Product);
    await products.index(ROWS);
    await products.find("shirt");
    expect(search.mock.calls[0]?.[1].scopePaths).toBeUndefined();
  });

  it("refuses a model without @Searchable", () => {
    const { database } = databaseOver([]);
    expect(() => new SearchIndex(new MemorySearchDriver(), database, Note)).toThrow(TypeError);
  });

  it("indexes under the model's table, loading the relations its paths walk", async () => {
    const driver = new MemorySearchDriver();
    const index = vi.spyOn(driver, "index");
    const { database, populate } = databaseOver(ROWS);
    await new SearchIndex(driver, database, Product).index(ROWS.slice(0, 1));
    expect(populate).toHaveBeenCalledWith([ROWS[0]], ["variants"]);
    expect(index).toHaveBeenCalledWith(
      { schema: "catalogue", table: "products", primaryKey: "id" },
      [{ id: "prd_1", fields: ["linen shirt", "ab 1"], filters: { status: ["active"] } }],
    );
  });

  it("finds loaded rows in rank order, filtered", async () => {
    const { products } = await indexed();
    const found = await products.find("LINEN", { filters: { status: "active" } });
    expect(found).toEqual([ROWS[0]]);
    expect(await products.find("shirt")).toEqual([ROWS[0], ROWS[1], ROWS[2]]);
  });

  it("pages with a cursor until the last page", async () => {
    const { products } = await indexed();
    const first = await products.page("shirt", { limit: 2 });
    expect(first).toEqual({ items: [ROWS[0], ROWS[1]], hasMore: true, nextCursor: "2" });
    const second = await products.page("shirt", { limit: 2, cursor: first.nextCursor });
    expect(second).toEqual({ items: [ROWS[2]], hasMore: false });
  });

  it("reads nothing for a phrase with no word", async () => {
    const { driver, products } = await indexed();
    const search = vi.spyOn(driver, "search");
    await expect(products.page(" - ")).resolves.toEqual({ items: [], hasMore: false });
    expect(search).not.toHaveBeenCalled();
  });

  it("refuses an unlisted filter, a bad limit and a forged cursor", async () => {
    const { products } = await indexed();
    await expect(products.find("shirt", { filters: { title: "x" } })).rejects.toThrow(TypeError);
    await expect(products.find("shirt", { limit: 0 })).rejects.toThrow(RangeError);
    await expect(products.find("shirt", { limit: 101 })).rejects.toThrow(RangeError);
    const refused = await products.page("shirt", { cursor: "-1" }).catch((error: unknown) => error);
    expect(isRefusal(refused, SearchCursorInvalidError)).toBe(true);
  });

  it("counts the filter values of the matching rows, or of every row for an empty phrase", async () => {
    const { products } = await indexed();
    expect(await products.facets("linen", { paths: ["status"] })).toEqual({
      status: { active: 1, draft: 1 },
    });
    expect(await products.facets("", { paths: ["status"] })).toEqual({
      status: { active: 2, draft: 1 },
    });
    expect(
      await products.facets("shirt", { paths: ["status"], filters: { status: "draft" } }),
    ).toEqual({ status: { draft: 1 } });
    expect(await products.facets("", { paths: ["status"], limit: 1 })).toEqual({
      status: { active: 2 },
    });
  });

  it("refuses an unlisted facet path and a bad facet limit", async () => {
    const { products } = await indexed();
    await expect(products.facets("linen", { paths: ["brand"] })).rejects.toThrow(TypeError);
    await expect(products.facets("linen", { paths: ["status"], limit: 0 })).rejects.toThrow(
      RangeError,
    );
  });

  it("removes documents", async () => {
    const { products } = await indexed();
    await products.remove(["prd_1"]);
    await products.remove([]);
    expect(await products.find("linen")).toEqual([ROWS[2]]);
  });

  it("reindexes every row in batches and counts them", async () => {
    const driver = new MemorySearchDriver();
    const { database } = databaseOver(ROWS);
    const products = new SearchIndex(driver, database, Product);
    await expect(products.reindex()).resolves.toBe(3);
    expect(await products.find("shirt")).toHaveLength(3);
  });

  it("resumes a reindex after a cursor and reports each batch's cursor", async () => {
    const driver = new MemorySearchDriver();
    const { database } = databaseOver(ROWS);
    const products = new SearchIndex(driver, database, Product);
    const batches: string[] = [];
    await expect(
      products.reindex({
        after: "prd_1",
        onBatch: async (rows, cursor) => {
          batches.push(`${rows.length}:${cursor}`);
        },
      }),
    ).resolves.toBe(2);
    expect(batches).toEqual(["2:prd_3"]);
  });
});

describe("SearchIndex Arabizi, visibility and snippets", () => {
  @Searchable({ text: ["title", "advice"] })
  class Memo extends Model.with() {
    @Classify(PrivilegedDataClass)
    advice = "";

    id = "";

    title = "";
  }

  const MEMOS = [
    Object.assign(new Memo(), { id: "mem_1", title: "حبيبي مذكرة", advice: "" }),
    Object.assign(new Memo(), {
      id: "mem_2",
      title: "Lease review",
      advice: "The lease clause is void.",
    }),
  ];

  /** A memo index over MEMOS with the memory driver. */
  async function memos() {
    const driver = new MemorySearchDriver();
    const em = {
      getMetadata: () => ({ ...META, tableName: "memos" }),
      populate: async () => undefined,
      execute: async () => [{ paths: null }],
      find: async (_model: unknown, where: KeyFilter) =>
        MEMOS.filter((memo) => where.id?.$in?.includes(memo.id) ?? true),
    };
    const index = new SearchIndex(driver, { em: () => em } as unknown as Database, Memo);
    await index.index(MEMOS);
    return { driver, index };
  }

  afterEach(() => {
    connectVisibilityFilter(undefined);
    vi.restoreAllMocks();
  });

  it("finds Arabic text for an Arabizi word", async () => {
    const { driver, index } = await memos();
    const search = vi.spyOn(driver, "search");
    expect(await index.find("7abibi")).toEqual([MEMOS[0]]);
    expect(search.mock.calls[0]?.[1].alternatives).toEqual({ "7abibi": ["حبيبي"] });
  });

  it("leaves the Arabic spelling out when the read turns Arabizi off", async () => {
    const { driver, index } = await memos();
    const search = vi.spyOn(driver, "search");
    const facets = vi.spyOn(driver, "facets");
    expect(await index.find("7abibi", { arabizi: false })).toEqual([]);
    expect(search.mock.calls[0]?.[1].alternatives).toBeUndefined();
    await index.facets("7abibi", { paths: [], arabizi: false });
    expect(facets.mock.calls[0]?.[1].alternatives).toBeUndefined();
  });

  it("hands the driver the visibility subquery before it ranks", async () => {
    const { driver, index } = await memos();
    const search = vi.spyOn(driver, "search").mockResolvedValue([]);
    const builder = {
      select: () => builder,
      where: () => builder,
      toQuery: () => ({ sql: "select id from memos where wall = ?", params: [1] }),
    };
    vi.spyOn(DatabasePort, "current").mockReturnValue({
      em: () => ({ getMetadata: () => META, createQueryBuilder: () => builder }),
    } as unknown as DatabasePort);
    const filter = { conditionsFor: async () => ({ wall: 1 }) } as unknown as VisibilityFilter;
    connectVisibilityFilter({
      has: (token) => token === VisibilityFilter,
      get: () => filter as never,
    });
    await index.find("lease");
    expect(search.mock.calls[0]?.[1].visible).toEqual({
      sql: "select id from memos where wall = ?",
      params: [1],
    });
  });

  it("hands the driver the visibility subquery before it counts facets", async () => {
    const { driver, index } = await memos();
    const facets = vi.spyOn(driver, "facets").mockResolvedValue({});
    const builder = {
      select: () => builder,
      where: () => builder,
      toQuery: () => ({ sql: "select id from memos where wall = ?", params: [2] }),
    };
    vi.spyOn(DatabasePort, "current").mockReturnValue({
      em: () => ({ getMetadata: () => META, createQueryBuilder: () => builder }),
    } as unknown as DatabasePort);
    const filter = { conditionsFor: async () => ({ wall: 2 }) } as unknown as VisibilityFilter;
    connectVisibilityFilter({
      has: (token) => token === VisibilityFilter,
      get: () => filter as never,
    });
    await index.facets("lease", { paths: [] });
    expect(facets.mock.calls[0]?.[1]).toMatchObject({
      words: ["lease"],
      paths: [],
      limit: 20,
      visible: { sql: "select id from memos where wall = ?", params: [2] },
    });
  });

  it("excerpts a privileged field only for the record's team", async () => {
    const { index } = await memos();
    expect([...index.snippets(MEMOS, "clause")]).toEqual([]);
    expect([...index.snippets(MEMOS, "clause", { isTeamMember: () => true })]).toEqual([
      ["mem_2", "The lease clause is void."],
    ]);
    expect([...index.snippets(MEMOS, "lease")]).toEqual([["mem_2", "Lease review"]]);
  });
});

@Searchable({
  text: ["title"],
  filters: ["status"],
  semantic: true,
})
class Guide extends Model.with() {
  id = "";

  title = "";

  status = "draft";
}

/** A memory driver that claims the vector lane and answers every search with `ids`. */
class FusingDriver extends MemorySearchDriver {
  override readonly fusesVectors = true;
}

describe("SearchIndex vector lane", () => {
  const embedder = {
    dimensions: 2,
    embed: vi.fn(async (texts: readonly string[]) => texts.map(() => [0.6, 0.8])),
  } as unknown as Embedder;

  it("embeds the folded phrase and reads by the vector lane alone for similar", async () => {
    const driver = new FusingDriver();
    const search = vi.spyOn(driver, "search").mockResolvedValue(["prd_2"]);
    const guides = new SearchIndex(driver, databaseOver(ROWS).database, Guide);
    expect(
      await guides.similar("Shirt  Dress!", { embedder, filters: { status: "active" } }),
    ).toEqual([ROWS[1]]);
    expect(embedder.embed).toHaveBeenCalledWith(["shirt dress"]);
    expect(search.mock.calls[0]?.[1]).toMatchObject({
      words: [],
      filters: { status: "active" },
      vector: { values: [0.6, 0.8], passages: { source: "search", model: "Guide" } },
    });
  });

  it("adds the vector to a find on a semantic index given an embedder, and only then", async () => {
    const driver = new FusingDriver();
    const search = vi.spyOn(driver, "search").mockResolvedValue([]);
    const guides = new SearchIndex(driver, databaseOver(ROWS).database, Guide);
    await guides.find("linen", { embedder });
    await guides.find("linen");
    expect(search.mock.calls[0]?.[1]).toMatchObject({
      words: ["linen"],
      vector: { values: [0.6, 0.8] },
    });
    expect(search.mock.calls[1]?.[1].vector).toBeUndefined();
    const lexical = new MemorySearchDriver();
    const plain = vi.spyOn(lexical, "search");
    await new SearchIndex(lexical, databaseOver(ROWS).database, Guide).find("linen", { embedder });
    expect(plain.mock.calls[0]?.[1].vector).toBeUndefined();
    const products = vi.spyOn(driver, "search");
    await new SearchIndex(driver, databaseOver(ROWS).database, Product).find("linen", { embedder });
    expect(products.mock.calls.at(-1)?.[1].vector).toBeUndefined();
  });

  it("refuses similar on a model that is not semantic or a driver without the vector lane", async () => {
    const { database } = databaseOver(ROWS);
    await expect(
      new SearchIndex(new FusingDriver(), database, Product).similar("x", { embedder }),
    ).rejects.toThrow(/semantic: true/);
    await expect(
      new SearchIndex(new MemorySearchDriver(), database, Guide).similar("x", { embedder }),
    ).rejects.toThrow(/does not rank by vectors/);
  });

  it("reads nothing for a blank phrase and refuses an embedder that gives no vector", async () => {
    const driver = new FusingDriver();
    const guides = new SearchIndex(driver, databaseOver(ROWS).database, Guide);
    expect(await guides.similar("  ", { embedder })).toEqual([]);
    const silent = { dimensions: 2, embed: async () => [] } as unknown as Embedder;
    await expect(guides.similar("linen", { embedder: silent })).rejects.toThrow(RangeError);
  });
});

describe("SearchIndex versions", () => {
  it("readies a version, rebuilds into it while reads stay live, and swaps it live", async () => {
    const { driver, products } = await indexed();
    const index = vi.spyOn(driver, "index");
    await products.prepare(2);
    expect(await products.reindex({ version: 2 })).toBe(3);
    expect(index.mock.calls[0]?.[0]).toEqual({
      schema: "catalogue",
      table: "products",
      primaryKey: "id",
      version: 2,
    });
    expect(await products.find("linen")).toEqual([ROWS[0], ROWS[2]]);
    await products.swap(2);
    expect(await products.find("linen")).toEqual([ROWS[0], ROWS[2]]);
  });

  it("refuses a version outside 2 to 999 before reaching the driver", async () => {
    const { driver, products } = await indexed();
    const prepare = vi.spyOn(driver, "prepare");
    for (const version of [1, 1000, 2.5]) {
      await expect(products.prepare(version)).rejects.toThrow(RangeError);
      await expect(products.swap(version)).rejects.toThrow(RangeError);
      await expect(products.reindex({ version })).rejects.toThrow(RangeError);
    }
    expect(prepare).not.toHaveBeenCalled();
  });
});
