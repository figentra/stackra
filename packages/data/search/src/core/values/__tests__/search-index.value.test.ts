/**
 * Stackra file contract:
 * Purpose: unit tests of `SearchIndex`: indexing loads the facet's relations and stores normalised documents under the
 *          model's table; `find` and `page` return loaded rows in rank order with the next cursor; filters, limits and
 *          cursors are checked; a phrase with no word reads nothing; `remove` and `reindex` reach the driver.
 * Boundary: test only; the memory driver ranks and a stand-in entity manager answers metadata, populate and find from
 *           a fixed list, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0221 (decisions 1 to 3 and 7).
 */
import type { Database } from "@stackra/database";
import { isRefusal } from "@stackra/errors";
import { Model, Searchable } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { MemorySearchDriver } from "#core/drivers/memory-search.driver";
import { SearchCursorInvalidError } from "#core/errors/search-cursor-invalid.error";
import { SearchIndex } from "#core/values/search-index.value";

@Searchable({ text: ["title", "variants.sku"], filters: ["status"] })
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

/** A database whose entity manager reads `rows`, with the populate calls recorded. */
function databaseOver(rows: readonly Product[]) {
  const populate = vi.fn(async (_rows: readonly Product[], _hints: readonly string[]) => undefined);
  const em = {
    getMetadata: () => META,
    populate,
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
});
