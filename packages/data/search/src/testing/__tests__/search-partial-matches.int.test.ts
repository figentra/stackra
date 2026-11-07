/**
 * Stackra file contract:
 * Purpose: integration test of the partial lane (ADR 0221, note of 2026-11-07): on real Postgres, a multi-word query
 *          returns every row holding all its words first, in the order full matching ranks them, and then the rows
 *          holding only some of its words; a row holding none never comes back. One English and one Arabic case.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers. The text functions of migrations 0001 and 0003
 *           are applied compiled, and the product table carries the plain and the Arabic vector, as in the
 *           evaluation test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0221; ADR 0182 (integration tier); ADR 0269.
 */
import { compileMigration } from "@stackra/database";
import { usePostgres } from "@stackra/database/testing";
import { beforeAll, describe, expect, it } from "@stackra/testing";

import { searchWordsOf } from "#core/functions/search-words-of.function";
import { CreateTextFunctionsMigration } from "#node/database/migrations/0001-create-text-functions.migration";
import { CreateFoldFunctionMigration } from "#node/database/migrations/0003-create-fold-function.migration";
import { PostgresSearchDriver } from "#node/drivers/postgres-search.driver";

const postgres = usePostgres({
  entities: [],
  migrations: [
    compileMigration(CreateTextFunctionsMigration, { schema: "search", createsSchema: true }),
    compileMigration(CreateFoldFunctionMigration, { schema: "search" }),
  ],
});

/** The searched table. */
const TABLE = { schema: "shop", table: "products", primaryKey: "id" } as const;

/** Full matches (e1 strongest), a partial match and a row matching nothing, in English and Arabic. */
const CATALOGUE = [
  { id: "e1", title: "Linen shirt", description: "A linen shirt for summer" },
  { id: "e2", title: "Shirt", description: "Cotton with a little linen" },
  { id: "e3", title: "Linen trousers", description: "Relaxed trousers" },
  { id: "e4", title: "Wool coat", description: "A warm coat" },
  { id: "a1", title: "قميص كتان", description: "قميص كتان للصيف" },
  { id: "a2", title: "قميص", description: "قطن مع قليل من الكتان" },
  { id: "a3", title: "بنطلون كتان", description: "بنطلون مريح" },
  { id: "a4", title: "معطف صوف", description: "معطف دافئ" },
] as const;

describe("search partial matches on Postgres", () => {
  let driver: PostgresSearchDriver;

  beforeAll(async () => {
    driver = new PostgresSearchDriver(postgres.database);
    const em = postgres.database.em() as unknown as {
      execute: (sql: string, params?: readonly unknown[]) => Promise<unknown>;
    };
    await em.execute("create schema shop");
    await em.execute(`create table shop.products (
      id text primary key,
      search_vector tsvector, search_vector_ar tsvector, search_text text, search_filters jsonb
    )`);
    await em.execute(
      `insert into shop.products (id) values ${CATALOGUE.map(() => "(?)").join(", ")}`,
      CATALOGUE.map((product) => product.id),
    );
    await driver.index(
      TABLE,
      CATALOGUE.map((product) => ({
        id: product.id,
        fields: [
          searchWordsOf(product.title).join(" "),
          searchWordsOf(product.description).join(" "),
        ],
        filters: {},
      })),
    );
  }, 60_000);

  /** The ids `query` returns. */
  const search = (query: string) =>
    driver.search(TABLE, {
      words: [...new Set(searchWordsOf(query))],
      filters: {},
      offset: 0,
      limit: 50,
    });

  it("returns the full English matches in their order, then the partial one, and never the unrelated row", async () => {
    const ids = await search("linen shirt");
    expect(ids.filter((id) => id.startsWith("e"))).toEqual(["e1", "e2", "e3"]);
  });

  it("returns the full Arabic matches in their order, then the partial one, and never the unrelated row", async () => {
    const ids = await search("قميص كتان");
    expect(ids.filter((id) => id.startsWith("a"))).toEqual(["a1", "a2", "a3"]);
  });

  it("keeps a one-word query to the rows holding that word", async () => {
    const ids = await search("coat");
    expect(ids).toEqual(["e4"]);
  });
});
