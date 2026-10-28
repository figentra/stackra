/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresSearchDriver`, alternatives (Arabizi, synonyms) in both lanes and the visibility
 *          subquery included: it reads a table's vector columns from the catalogue once (locale and
 *          configuration from the column name), writes each document as weighted vectors per locale with the folded
 *          text and filter values, clears removed documents, and ranks with the two fused lanes, every value bound as a
 *          parameter in placeholder order; facets count filter values over either lane's matches (or every indexed row
 *          for no words) under the visibility subquery, through the `search.fold` trigram function.
 * Boundary: test only; a stand-in entity manager records each statement and answers the catalogue read and the
 *           search from fixed rows, so no database runs. The SQL itself runs in the integration tier.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0221 (decisions 1, 3 and 7); ADR 0160; ADR 0404; stackra-301 (the vector lane).
 */
import type { Database } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { SearchDriver } from "#contracts/index";
import type { SearchTable } from "#contracts/index";
import { PostgresSearchDriver } from "#node/drivers/postgres-search.driver";

const PRODUCTS: SearchTable = { schema: "catalogue", table: "products", primaryKey: "id" };

/** One recorded statement. */
interface Statement {
  readonly sql: string;
  readonly params: readonly unknown[];
}

/** A database whose entity manager reports `columns` from the catalogue, `ids` from a search and `counts` from facets. */
function databaseWith(
  columns: readonly string[],
  ids: readonly string[] = [],
  counts: readonly { readonly path: string; readonly value: string; readonly count: number }[] = [],
) {
  const statements: Statement[] = [];
  const em = {
    execute: async (sql: string, params: readonly unknown[] = []) => {
      statements.push({ sql, params });
      if (sql.includes("information_schema.columns"))
        return columns.map((name) => ({ column_name: name }));
      if (sql.startsWith("with hits")) return counts;
      return sql.startsWith("with q") ? ids.map((id) => ({ id })) : [];
    },
  };
  return { database: { em: () => em } as unknown as Database, statements };
}

describe(PostgresSearchDriver, () => {
  it("is a SearchDriver", () => {
    expect(new PostgresSearchDriver({} as Database)).toBeInstanceOf(SearchDriver);
  });

  it("writes weighted vectors per locale, the folded text and the filters", async () => {
    const { database, statements } = databaseWith(["search_vector_ar", "search_vector_en"]);
    const driver = new PostgresSearchDriver(database);
    await driver.index(PRODUCTS, [
      {
        id: "prd_1",
        fields: [{ en: "linen shirt", ar: "قميص كتان" }, "ab 1"],
        filters: { status: ["active"] },
      },
    ]);
    await driver.index(PRODUCTS, []);
    const [catalogue, update] = statements;
    expect(catalogue?.params).toEqual(["catalogue", "products"]);
    expect(update?.sql).toBe(
      `update "catalogue"."products" set "search_vector_ar" = setweight(to_tsvector('arabic', ?), 'A') || setweight(to_tsvector('arabic', ?), 'B'), "search_vector_en" = setweight(to_tsvector('english', ?), 'A') || setweight(to_tsvector('english', ?), 'B'), "search_text" = ?, "search_filters" = ?::jsonb where "id" = ?`,
    );
    expect(update?.params).toEqual([
      "قميص كتان",
      "ab 1",
      "linen shirt",
      "ab 1",
      "linen shirt قميص كتان ab 1",
      '{"status":["active"]}',
      "prd_1",
    ]);
    expect(statements).toHaveLength(2);
  });

  it("reads the catalogue once per table and uses simple for the locale-free vector", async () => {
    const { database, statements } = databaseWith(["search_vector"]);
    const driver = new PostgresSearchDriver(database);
    const table: SearchTable = { table: "entries", primaryKey: "id" };
    await driver.remove(table, ["acl_1", "acl_2"]);
    await driver.index(table, [{ id: "acl_3", fields: ["orders cancel"], filters: {} }]);
    expect(statements.filter((statement) => statement.sql.includes("information_schema"))).toEqual([
      expect.objectContaining({ params: ["entries"] }),
    ]);
    expect(statements[0]?.sql).toContain("table_schema = current_schema()");
    expect(statements[1]).toEqual({
      sql: `update "entries" set "search_vector" = null, "search_text" = null, "search_filters" = null where "id" in (?, ?)`,
      params: ["acl_1", "acl_2"],
    });
    expect(statements[2]?.sql).toContain(`setweight(to_tsvector('simple', ?), 'A')`);
  });

  it("ranks with both lanes fused, binding every value in order", async () => {
    const { database, statements } = databaseWith(
      ["search_vector_ar", "search_vector_en"],
      ["prd_2", "prd_1"],
    );
    const driver = new PostgresSearchDriver(database);
    const ids = await driver.search(PRODUCTS, {
      words: ["linen", "shi"],
      filters: { status: "active", "collections.slug": "sale" },
      offset: 20,
      limit: 21,
    });
    expect(ids).toEqual(["prd_2", "prd_1"]);
    const search = statements.at(-1);
    expect(search?.sql).toContain("to_tsquery('arabic', ?) as q0, to_tsquery('english', ?) as q1");
    expect(search?.sql).toContain(
      `greatest(ts_rank_cd(t."search_vector_ar", q.q0), ts_rank_cd(t."search_vector_en", q.q1))`,
    );
    expect(search?.sql).toContain(`search.fold(t."search_text") %> ?`);
    expect(search?.sql).toContain("from fts full join trigram");
    const filter = '{"status":["active"],"collections.slug":["sale"]}';
    expect(search?.params).toEqual([
      "linen:* & shi:*",
      "linen:* & shi:*",
      filter,
      "linen shi",
      "linen shi",
      filter,
      21,
      20,
    ]);
    const placeholders = search?.sql.match(/\?/g) ?? [];
    expect(placeholders).toHaveLength(search?.params.length ?? -1);
  });

  it("fuses the vector lane as a third lane under the same narrowing, binding every value in order", async () => {
    const { database, statements } = databaseWith(["search_vector"], ["prd_1"]);
    const driver = new PostgresSearchDriver(database);
    expect(driver.fusesVectors).toBe(true);
    const visible = {
      sql: 'select "v"."id" from "catalogue"."products" as "v" where "w" = ?',
      params: [1],
    };
    await driver.search(PRODUCTS, {
      words: ["mug"],
      filters: {},
      offset: 0,
      limit: 5,
      visible,
      vector: { values: [0.1, 0.9], passages: { source: "search", model: "Product" } },
    });
    const search = statements.at(-1);
    expect(search?.sql).toContain(`(v."embedding"::vector(2)) <=> ?::vector(2)`);
    expect(search?.sql).toContain(
      `from near join "catalogue"."products" t on t."id"::text = near.row_id`,
    );
    expect(search?.sql).toContain(
      "from fts full join trigram on trigram.id = fts.id full join vec on vec.id = coalesce(fts.id, trigram.id)",
    );
    expect(search?.sql).toContain("coalesce(1.0 / (60 + vec.rank), 0)");
    expect(search?.sql.match(/ and t\."id" in \(select "v"\."id"/g)).toHaveLength(3);
    expect(search?.params).toEqual([
      "mug:*",
      1,
      "mug",
      "mug",
      1,
      "[0.1,0.9]",
      '{"source":"search","model":"Product"}',
      1,
      5,
      0,
    ]);
    expect(search?.sql.match(/\?/g)).toHaveLength(search?.params.length ?? -1);
  });

  it("ranks by the vector lane alone for a semantic read, without reading the catalogue", async () => {
    const { database, statements } = databaseWith(["search_vector"]);
    await new PostgresSearchDriver(database).search(PRODUCTS, {
      words: [],
      filters: { status: "active" },
      offset: 0,
      limit: 5,
      vector: { values: [1, 0, 0], passages: { model: "Product" } },
    });
    expect(statements).toHaveLength(1);
    const search = statements[0];
    expect(search?.sql.startsWith("with near as")).toBe(true);
    expect(search?.sql).not.toContain("fts");
    expect(search?.sql).toContain("select vec.id as id");
    expect(search?.params).toEqual([
      "[1,0,0]",
      '{"model":"Product"}',
      '{"status":["active"]}',
      5,
      0,
    ]);
  });

  it("refuses a query vector that is not finite numbers, and ranks nothing with neither words nor vector", async () => {
    const { database, statements } = databaseWith(["search_vector"]);
    const driver = new PostgresSearchDriver(database);
    await expect(
      driver.search(PRODUCTS, {
        words: [],
        filters: {},
        offset: 0,
        limit: 5,
        vector: { values: [Number.NaN], passages: {} },
      }),
    ).rejects.toThrow(TypeError);
    await expect(
      driver.search(PRODUCTS, { words: [], filters: {}, offset: 0, limit: 5 }),
    ).resolves.toEqual([]);
    expect(statements).toHaveLength(0);
  });

  it("leaves the filter out when none is asked for", async () => {
    const { database, statements } = databaseWith(["search_vector"]);
    await new PostgresSearchDriver(database).search(PRODUCTS, {
      words: ["mug"],
      filters: {},
      offset: 0,
      limit: 5,
    });
    expect(statements.at(-1)?.sql).not.toContain("search_filters");
    expect(statements.at(-1)?.params).toEqual(["mug:*", "mug", "mug", 5, 0]);
  });

  it("ORs a word's alternatives in both lanes and narrows both by the visibility subquery", async () => {
    const { database, statements } = databaseWith(["search_vector"]);
    await new PostgresSearchDriver(database).search(PRODUCTS, {
      words: ["7abibi", "mug"],
      filters: {},
      offset: 0,
      limit: 5,
      alternatives: { "7abibi": ["حبيبي"] },
      visible: {
        sql: 'select "visible"."id" from "catalogue"."products" as "visible" where "wall" = ?',
        params: [1],
      },
    });
    const search = statements.at(-1);
    expect(search?.params).toEqual([
      "(7abibi:* | حبيبي:*) & mug:*",
      1,
      "7abibi mug",
      "حبيبي mug",
      "7abibi mug",
      "حبيبي mug",
      1,
      5,
      0,
    ]);
    expect(search?.sql).toContain(
      `greatest(word_similarity(?, search.fold(t."search_text")), word_similarity(?, search.fold(t."search_text")))`,
    );
    expect(search?.sql).toContain(
      `(search.fold(t."search_text") %> ? or search.fold(t."search_text") %> ?)`,
    );
    expect(search?.sql.match(/ and t\."id" in \(select "visible"\."id"/g)).toHaveLength(2);
    expect(search?.sql.match(/\?/g)).toHaveLength(search?.params.length ?? -1);
  });

  it("swaps one word at a time for a synonym in the trigram lane, and counts facets over the same phrases", async () => {
    const { database, statements } = databaseWith(["search_vector"]);
    const driver = new PostgresSearchDriver(database);
    const request = {
      words: ["blue", "sofa"],
      filters: {},
      alternatives: { sofa: ["couch", "settee"] },
    };
    await driver.search(PRODUCTS, { ...request, offset: 0, limit: 5 });
    expect(statements.at(-1)?.params).toEqual([
      "blue:* & (sofa:* | couch:* | settee:*)",
      "blue sofa",
      "blue couch",
      "blue settee",
      "blue sofa",
      "blue couch",
      "blue settee",
      5,
      0,
    ]);
    await driver.facets(PRODUCTS, { ...request, paths: ["status"], limit: 5 });
    const count = statements.at(-1);
    expect(count?.params).toEqual([
      "blue:* & (sofa:* | couch:* | settee:*)",
      "blue sofa",
      "blue couch",
      "blue settee",
      ["status"],
      5,
    ]);
    expect(count?.sql.match(/\?/g)).toHaveLength(count?.params.length ?? -1);
  });

  it("caps the trigram phrases at eight", async () => {
    const { database, statements } = databaseWith(["search_vector"]);
    await new PostgresSearchDriver(database).search(PRODUCTS, {
      words: ["sofa"],
      filters: {},
      offset: 0,
      limit: 5,
      alternatives: { sofa: ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9"] },
    });
    const search = statements.at(-1);
    expect(search?.sql.match(/%> \?/g)).toHaveLength(8);
    expect(search?.sql.match(/\?/g)).toHaveLength(search?.params.length ?? -1);
  });

  it("refuses a table without search columns", async () => {
    const { database } = databaseWith([]);
    await expect(
      new PostgresSearchDriver(database).search(PRODUCTS, {
        words: ["mug"],
        filters: {},
        offset: 0,
        limit: 5,
      }),
    ).rejects.toThrow(TypeError);
  });

  it("counts facet values over both lanes' matches under the visibility subquery", async () => {
    const { database, statements } = databaseWith(
      ["search_vector_ar", "search_vector_en"],
      [],
      [
        { path: "status", value: "active", count: 4 },
        { path: "status", value: "draft", count: 1 },
      ],
    );
    const facets = await new PostgresSearchDriver(database).facets(PRODUCTS, {
      words: ["linen"],
      filters: { brand: "acme" },
      paths: ["status", "collections.slug"],
      limit: 10,
      visible: {
        sql: 'select "visible"."id" from "catalogue"."products" as "visible" where "wall" = ?',
        params: [1],
      },
    });
    expect(facets).toEqual({ status: { active: 4, draft: 1 }, "collections.slug": {} });
    const count = statements.at(-1);
    expect(count?.sql).toContain(
      `t."search_vector_ar" @@ to_tsquery('arabic', ?) or t."search_vector_en" @@ to_tsquery('english', ?)`,
    );
    expect(count?.sql).toContain(`search.fold(t."search_text") %> ?`);
    expect(count?.sql).toContain(`and t."id" in (select "visible"."id"`);
    expect(count?.sql).toContain("count(distinct hits.id)");
    expect(count?.params).toEqual([
      "linen:*",
      "linen:*",
      "linen",
      '{"brand":["acme"]}',
      1,
      ["status", "collections.slug"],
      10,
    ]);
    expect(count?.sql.match(/\?/g)).toHaveLength(count?.params.length ?? -1);
  });

  it("counts every indexed row for no words, and asks nothing for no path", async () => {
    const { database, statements } = databaseWith(["search_vector"]);
    const driver = new PostgresSearchDriver(database);
    await expect(
      driver.facets(PRODUCTS, { words: [], filters: {}, paths: [], limit: 5 }),
    ).resolves.toEqual({});
    expect(statements).toHaveLength(0);
    await driver.facets(PRODUCTS, { words: [], filters: {}, paths: ["status"], limit: 5 });
    const count = statements.at(-1);
    expect(count?.sql).toContain(`where t."search_filters" is not null`);
    expect(count?.params).toEqual([["status"], 5]);
  });
});
