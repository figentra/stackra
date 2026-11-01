/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresRecommenderDriver`: `similar` reads the nearest passages grouped by row from
 *          `search.vector_items` with every value bound and the checked dimension written into the SQL, `boughtTogether`
 *          reads the configured co-occurrence table's best rows (empty with none configured), a limit comes from the call or
 *          the configuration, and a bad dimension, table name or limit is refused.
 * Boundary: test only; a stand-in entity manager records each statement and answers from fixed rows, so no database
 *           runs. The SQL itself runs in the integration tier.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0492 (decision 8); ADR 0160.
 */
import { buildConfig } from "@stackra/config";
import type { Database } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { SearchConfig } from "#config/search.config";
import { Recommender } from "#contracts/index";
import { PostgresRecommenderDriver } from "#node/drivers/postgres-recommender.driver";

/** One recorded statement. */
interface Statement {
  readonly sql: string;
  readonly params: readonly unknown[];
}

/** A database answering every statement with `rows`, recording each. */
function databaseAnswering(rows: readonly object[]) {
  const statements: Statement[] = [];
  const em = {
    execute: async (sql: string, params: readonly unknown[] = []) => {
      statements.push({ sql, params });
      return rows;
    },
  };
  return { database: { em: () => em } as unknown as Database, statements };
}

/** A hand-made config: the shipped schema refuses these values, so the driver's own checks are reached this way. */
const raw = (embedder: number, cooccurrence: string | null) =>
  ({
    embedder: { dimensions: embedder },
    recommender: { cooccurrence, limit: 10 },
  }) as unknown as SearchConfig;

/** The configuration with the given recommender and embedder overrides. */
const configOf = (values: object) => buildConfig(SearchConfig, { values });

describe(PostgresRecommenderDriver, () => {
  it("is a Recommender", () => {
    expect(new PostgresRecommenderDriver({} as Database, configOf({}))).toBeInstanceOf(Recommender);
  });

  it("reads the nearest passages grouped by row, never the item itself, with every value bound", async () => {
    const { database, statements } = databaseAnswering([
      { id: "prd_2", score: "0.9" },
      { id: "prd_3", score: 0.5 },
    ]);
    const driver = new PostgresRecommenderDriver(database, configOf({}));
    expect(await driver.similar("prd_1", { limit: 2 })).toEqual([
      { id: "prd_2", score: 0.9 },
      { id: "prd_3", score: 0.5 },
    ]);
    const [statement] = statements;
    expect(statement?.sql).toContain('"search"."vector_items"');
    expect(statement?.sql).toContain("vector(1024)");
    expect(statement?.sql).toContain("group by near.id");
    expect(statement?.sql).not.toContain("prd_1");
    expect(statement?.params).toEqual([
      JSON.stringify({ source: "search", row: "prd_1" }),
      JSON.stringify({ source: "search" }),
      "prd_1",
      10,
      2,
    ]);
  });

  it("reads the co-occurrence table's best rows, and has none without a table", async () => {
    const { database, statements } = databaseAnswering([{ id: "prd_9", score: 12 }]);
    const driver = new PostgresRecommenderDriver(
      database,
      configOf({ recommender: { cooccurrence: "shop.pairs", limit: 4 } }),
    );
    expect(await driver.boughtTogether("prd_1")).toEqual([{ id: "prd_9", score: 12 }]);
    expect(statements[0]?.sql).toContain('from "shop"."pairs"');
    expect(statements[0]?.params).toEqual(["prd_1", "prd_1", 4]);
    const bare = databaseAnswering([{ id: "x", score: 1 }]);
    expect(
      await new PostgresRecommenderDriver(bare.database, configOf({})).boughtTogether("prd_1"),
    ).toEqual([]);
    expect(bare.statements).toEqual([]);
  });

  it("refuses a bad table name, dimension and limit", async () => {
    const { database } = databaseAnswering([]);
    expect(
      () =>
        new PostgresRecommenderDriver(
          database,
          configOf({ recommender: { cooccurrence: "shop.pairs" } }),
        ),
    ).not.toThrow();
    expect(() => new PostgresRecommenderDriver(database, raw(1024, "pairs; drop table x"))).toThrow(
      TypeError,
    );
    expect(() => new PostgresRecommenderDriver(database, raw(0, null))).toThrow(RangeError);
    await expect(
      new PostgresRecommenderDriver(database, configOf({})).similar("p", { limit: 0 }),
    ).rejects.toThrow(RangeError);
  });
});
