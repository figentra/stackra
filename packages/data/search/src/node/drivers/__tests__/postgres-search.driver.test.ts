/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresSearchDriver`, Arabizi alternatives and the visibility subquery included: it reads a table's vector columns from the catalogue once (locale and
 *          configuration from the column name), writes each document as weighted vectors per locale with the folded
 *          text and filter values, clears removed documents, and ranks with the two fused lanes, every value bound as a
 *          parameter in placeholder order.
 * Boundary: test only; a stand-in entity manager records each statement and answers the catalogue read and the
 *           search from fixed rows, so no database runs. The SQL itself runs in the integration tier.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0221 (decisions 1, 3 and 7); ADR 0160.
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

/** A database whose entity manager reports `columns` from the catalogue and `ids` from a search. */
function databaseWith(columns: readonly string[], ids: readonly string[] = []) {
  const statements: Statement[] = [];
  const em = {
    execute: async (sql: string, params: readonly unknown[] = []) => {
      statements.push({ sql, params });
      if (sql.includes("information_schema.columns"))
        return columns.map((name) => ({ column_name: name }));
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
    expect(search?.sql).toContain(`search.unaccent_immutable(t."search_text") %> ?`);
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

  it("ORs an Arabizi word's alternatives and narrows both lanes by the visibility subquery", async () => {
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
      "7abibi mug",
      1,
      5,
      0,
    ]);
    expect(search?.sql.match(/ and t\."id" in \(select "visible"\."id"/g)).toHaveLength(2);
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
});
