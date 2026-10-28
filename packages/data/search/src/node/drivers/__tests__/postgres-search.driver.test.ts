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
 * Governing contract: ADR 0022; ADR 0269; ADR 0221 (decisions 1, 3 and 7); ADR 0160; ADR 0404; stackra-301 (the vector lane); stackra-303 (versions);
 *                     stackra-302 (field kinds); stackra-326 (ranking rules, neighbours).
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

describe("PostgresSearchDriver versions", () => {
  const SHADOWED = ["search_vector_ar__v2", "search_vector_en", "search_vector_en__v2"];

  it("writes the live and every shadow version's columns in one statement, and clears them alike", async () => {
    const { database, statements } = databaseWith(SHADOWED);
    const driver = new PostgresSearchDriver(database);
    await driver.index(PRODUCTS, [{ id: "prd_1", fields: ["linen"], filters: {} }]);
    expect(statements[1]?.sql).toBe(
      `update "catalogue"."products" set "search_vector_en" = setweight(to_tsvector('english', ?), 'A'), "search_text" = ?, "search_filters" = ?::jsonb, "search_vector_ar__v2" = setweight(to_tsvector('arabic', ?), 'A'), "search_vector_en__v2" = setweight(to_tsvector('english', ?), 'A'), "search_text__v2" = ?, "search_filters__v2" = ?::jsonb where "id" = ?`,
    );
    expect(statements[1]?.params).toEqual([
      "linen",
      "linen",
      "{}",
      "linen",
      "linen",
      "linen",
      "{}",
      "prd_1",
    ]);
    await driver.remove(PRODUCTS, ["prd_1"]);
    expect(statements[2]?.sql).toBe(
      `update "catalogue"."products" set "search_vector_en" = null, "search_text" = null, "search_filters" = null, "search_vector_ar__v2" = null, "search_vector_en__v2" = null, "search_text__v2" = null, "search_filters__v2" = null where "id" in (?)`,
    );
  });

  it("writes one version alone for a rebuild, and ranks on the live columns only", async () => {
    const { database, statements } = databaseWith(SHADOWED);
    const driver = new PostgresSearchDriver(database);
    const v2 = { ...PRODUCTS, version: 2 };
    await driver.index(v2, [{ id: "prd_1", fields: ["linen"], filters: {} }]);
    expect(statements[1]?.sql).not.toContain(`"search_text" =`);
    expect(statements[1]?.sql).toContain(`"search_text__v2" = ?`);
    await driver.search(PRODUCTS, { words: ["linen"], filters: {}, offset: 0, limit: 5 });
    expect(statements.at(-1)?.sql).toContain(`to_tsquery('english', ?) as q0`);
    expect(statements.at(-1)?.sql).not.toContain("__v2");
    await expect(
      driver.search(v2, { words: ["linen"], filters: {}, offset: 0, limit: 5 }),
    ).rejects.toThrow(/contract migration/);
  });

  it("prepares and swaps only a version whose shadow columns exist, reading the catalogue again", async () => {
    const { database, statements } = databaseWith(SHADOWED);
    const driver = new PostgresSearchDriver(database);
    await driver.prepare(PRODUCTS, 2);
    await driver.prepare(PRODUCTS, 2);
    expect(
      statements.filter((statement) => statement.sql.includes("information_schema")),
    ).toHaveLength(2);
    await driver.swap(PRODUCTS, 2);
    expect(statements.filter((statement) => statement.sql.startsWith("update"))).toEqual([]);
    await expect(driver.prepare(PRODUCTS, 3)).rejects.toThrow(
      /t\.searchable\(\{ \.\.\., version: 3 \}\)/,
    );
    await expect(driver.swap(PRODUCTS, 3)).rejects.toThrow(TypeError);
    await expect(
      driver.index({ ...PRODUCTS, version: 3 }, [{ id: "x", fields: ["a"], filters: {} }]),
    ).rejects.toThrow(TypeError);
  });
});

describe("PostgresSearchDriver field kinds", () => {
  it("applies any-of filters and ranges in every lane and sorts the fused matches, binding in order", async () => {
    const { database, statements } = databaseWith(["search_vector"], ["prd_1"]);
    const driver = new PostgresSearchDriver(database);
    expect(driver.fieldKinds).toBe(true);
    await driver.search(PRODUCTS, {
      words: ["lamp"],
      filters: {},
      anyOf: { color: ["red", "blue"] },
      ranges: { price: { gte: 100, lt: 500 }, launchedAt: { lte: "2026-10-01T00:00:00.000Z" } },
      sort: [{ path: "price", direction: "desc" }, { path: "launchedAt" }],
      offset: 0,
      limit: 11,
    });
    const search = statements.at(-1);
    expect(search?.sql).toContain(
      `and (t."search_filters" @> ?::jsonb or t."search_filters" @> ?::jsonb)`,
    );
    expect(search?.sql).toContain(
      `jsonb_typeof(r.v) = 'number' and (r.v #>> '{}')::numeric >= ?::numeric and (r.v #>> '{}')::numeric < ?::numeric`,
    );
    expect(search?.sql).toContain(`jsonb_typeof(r.v) = 'string' and (r.v #>> '{}') <= ?::text`);
    expect(search?.sql).toContain(`join "catalogue"."products" t on t."id" = fused.id`);
    expect(search?.sql).toContain(
      `order by (t."search_filters" -> ? -> 0) desc nulls last, (t."search_filters" -> ? -> 0) asc nulls last, fused.score desc, fused.id`,
    );
    const narrowing = [
      '{"color":["red"]}',
      '{"color":["blue"]}',
      "price",
      100,
      500,
      "launchedAt",
      "2026-10-01T00:00:00.000Z",
    ];
    expect(search?.params).toEqual([
      "lamp:*",
      ...narrowing,
      "lamp",
      "lamp",
      ...narrowing,
      "price",
      "launchedAt",
      11,
      0,
    ]);
    expect(search?.sql.match(/\?/g) ?? []).toHaveLength(search?.params.length ?? -1);
  });

  it("writes a document's weights as its setweight letters", async () => {
    const { database, statements } = databaseWith(["search_vector"]);
    await new PostgresSearchDriver(database).index(PRODUCTS, [
      { id: "prd_1", fields: ["shirt", "ab 1"], weights: [2, 0], filters: {} },
    ]);
    expect(statements.at(-1)?.sql).toContain(
      `setweight(to_tsvector('simple', ?), 'C') || setweight(to_tsvector('simple', ?), 'A')`,
    );
  });
});

describe("PostgresSearchDriver ranking rules and neighbours", () => {
  it("hides rows in every lane, ranks pins first and scales relevance by boosts and recency", async () => {
    const { database, statements } = databaseWith(["search_vector"], ["prd_9"]);
    const driver = new PostgresSearchDriver(database);
    expect(driver.appliesRules).toBe(true);
    await driver.search(PRODUCTS, {
      words: ["shirt"],
      filters: {},
      pinned: ["prd_9", "prd_8"],
      hidden: ["prd_7"],
      boosts: [{ path: "featured", value: true, factor: 2 }],
      recency: { path: "publishedAt", halfLifeDays: 30 },
      offset: 0,
      limit: 11,
    });
    const search = statements.at(-1);
    expect(search?.sql).toContain(`and not (t."id"::text = any(?::text[]))`);
    expect(search?.sql).toContain(`array_position(?::text[], t."id"::text) as rank`);
    expect(search?.sql).toContain("full join pin on pin.id = coalesce(fts.id, trigram.id)");
    expect(search?.sql).toContain("pin.rank as pin");
    expect(search?.sql).toContain(`join "catalogue"."products" t on t."id" = fused.id`);
    expect(search?.sql).toContain(
      `order by fused.pin asc nulls last, fused.score * (case when t."search_filters" @> ?::jsonb then ?::float8 else 1 end) * (case`,
    );
    expect(search?.sql).toContain(`~ '^\\d{4}-\\d{2}-\\d{2}'`);
    const hidden = [["prd_7"]];
    expect(search?.params).toEqual([
      "shirt:*",
      ...hidden,
      "shirt",
      "shirt",
      ...hidden,
      ["prd_9", "prd_8"],
      ["prd_9", "prd_8"],
      ...hidden,
      '{"featured":[true]}',
      2,
      "publishedAt",
      "publishedAt",
      "publishedAt",
      30,
      11,
      0,
    ]);
    expect(search?.sql.match(/\?/g) ?? []).toHaveLength(search?.params.length ?? -1);
  });

  it("reads each word's neighbours from the trigram-near rows under the visibility subquery", async () => {
    const { database, statements } = databaseWith(["search_vector"]);
    const neighbours = await new PostgresSearchDriver(database).neighbours(PRODUCTS, {
      words: ["linnen"],
      limit: 1,
      visible: { sql: "select id from visible where team = ?", params: ["team_1"] },
    });
    expect(neighbours).toEqual({});
    const [lookup] = statements;
    expect(lookup?.sql).toContain(
      `search.fold(t."search_text") %> ? and t."id" in (select id from visible where team = ?)`,
    );
    expect(lookup?.sql).toContain("similarity(s.word, ?) >= 0.3");
    expect(lookup?.params).toEqual(["linnen", "team_1", "linnen", "linnen", "linnen", 1]);
    expect(lookup?.sql.match(/\?/g) ?? []).toHaveLength(lookup?.params.length ?? -1);
  });
});
