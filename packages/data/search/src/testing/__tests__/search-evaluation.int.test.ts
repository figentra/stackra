/**
 * Stackra file contract:
 * Purpose: the evaluation test of ADR 0492: the fixed catalogue and queries (English, Arabic and mixed) are indexed on
 *          real Postgres through `PostgresSearchDriver` (the plain lane and the Arabic Snowball lane), every query is
 *          read the way `SearchIndex` reads one (one normalisation, Arabizi and synonym alternatives), and the mean
 *          NDCG@10 and recall@50 must reach `SEARCH_EVALUATION_THRESHOLDS`; a change that lowers either fails here.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers. The text functions of migrations 0001 and 0003
 *           are applied compiled; the product table is made here with the columns `t.searchable({ locales: ["ar"] })`
 *           adds beside the plain vector. The thresholds were set from the fixture's labels and are the first to run
 *           against a live engine: tune them in the same change as a ranking change, never on their own.
 * Runtime: node (vitest)
 * Governing contract: ADR 0492 (decision 5 and enforcement); ADR 0182 (integration tier); ADR 0221; ADR 0269.
 */
import { compileMigration } from "@stackra/database";
import { usePostgres } from "@stackra/database/testing";
import { beforeAll, describe, expect, it } from "@stackra/testing";

import { arabiziOf } from "#core/functions/arabizi-of.function";
import { searchSynonymsOf } from "#core/functions/search-synonyms-of.function";
import { searchWordsOf } from "#core/functions/search-words-of.function";
import { CreateTextFunctionsMigration } from "#node/database/migrations/0001-create-text-functions.migration";
import { CreateFoldFunctionMigration } from "#node/database/migrations/0003-create-fold-function.migration";
import { PostgresSearchDriver } from "#node/drivers/postgres-search.driver";
import { ndcgAt } from "#testing/ndcg-at.function";
import { recallAt } from "#testing/recall-at.function";
import { SEARCH_EVALUATION_CATALOGUE } from "#testing/search-evaluation-catalogue.constant";
import { SEARCH_EVALUATION_QUERIES } from "#testing/search-evaluation-queries.constant";
import { SEARCH_EVALUATION_SYNONYMS } from "#testing/search-evaluation-synonyms.constant";
import { SEARCH_EVALUATION_THRESHOLDS } from "#testing/search-evaluation-thresholds.constant";

const postgres = usePostgres({
  entities: [],
  migrations: [
    compileMigration(CreateTextFunctionsMigration, { schema: "search", createsSchema: true }),
    compileMigration(CreateFoldFunctionMigration, { schema: "search" }),
  ],
});

/** The searched table. */
const TABLE = { schema: "shop", table: "products", primaryKey: "id" } as const;

/** The mean of `values`. */
const mean = (values: readonly number[]): number =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

describe("search evaluation on Postgres", () => {
  let driver: PostgresSearchDriver;

  beforeAll(async () => {
    // the database exists only inside a hook or test (usePostgres)
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
      "insert into shop.products (id) values " +
        SEARCH_EVALUATION_CATALOGUE.map(() => "(?)").join(", "),
      SEARCH_EVALUATION_CATALOGUE.map((product) => product.id),
    );
    await driver.index(
      TABLE,
      SEARCH_EVALUATION_CATALOGUE.map((product) => ({
        id: product.id,
        fields: [
          searchWordsOf(`${product.title} ${product.titleAr}`).join(" "),
          searchWordsOf(`${product.description} ${product.descriptionAr}`).join(" "),
        ],
        filters: {},
      })),
    );
  }, 60_000);

  it("keeps the mean NDCG@10 and recall@50 at or above the thresholds", async () => {
    const ndcg: number[] = [];
    const recall: number[] = [];
    for (const judged of SEARCH_EVALUATION_QUERIES) {
      const words = [...new Set(searchWordsOf(judged.query))];
      const synonyms = searchSynonymsOf(SEARCH_EVALUATION_SYNONYMS, ["products"], judged.locale);
      const alternatives = Object.fromEntries(
        words.flatMap((word) => {
          const others = [
            ...(arabiziOf(word, judged.locale === "ar") === undefined
              ? []
              : [arabiziOf(word, judged.locale === "ar") as string]),
            ...(synonyms.get(word) ?? []),
          ];
          return others.length === 0 ? [] : [[word, others]];
        }),
      );
      const ids = await driver.search(TABLE, {
        words,
        filters: {},
        offset: 0,
        limit: 50,
        ...(Object.keys(alternatives).length === 0 ? {} : { alternatives }),
      });
      ndcg.push(ndcgAt(ids, judged.grades, 10));
      recall.push(recallAt(ids, judged.grades, 50));
    }
    expect(mean(ndcg)).toBeGreaterThanOrEqual(SEARCH_EVALUATION_THRESHOLDS.ndcgAt10);
    expect(mean(recall)).toBeGreaterThanOrEqual(SEARCH_EVALUATION_THRESHOLDS.recallAt50);
  });
});
