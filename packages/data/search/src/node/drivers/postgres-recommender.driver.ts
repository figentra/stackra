/**
 * Stackra file contract:
 * Purpose: `PostgresRecommenderDriver`, the server's day-one `Recommender`: `similar` is the items whose passages are
 *          nearest (pgvector cosine) to the item's own in `search.vector_items`, `boughtTogether` is the top rows of a
 *          co-occurrence table the host keeps (`search.recommender.cooccurrence`, `schema.table` with `item_id`,
 *          `other_id` and `score` columns, filled by an indexer read model).
 * Boundary: raw SQL on the running context's entity manager, so it joins the caller's transaction and scope session and
 *           row-level security decides every row (the vector table's scope policy, the host table's own). It knows no
 *           domain: an item is the `row` a semantic passage names (`@Searchable({ semantic: true })`), and the table is
 *           the host's. With no co-occurrence table configured, `boughtTogether` is empty. The table name is validated
 *           and quoted, every value is a bound parameter, and the vector dimension (`search.embedder.dimensions`) is
 *           written into the SQL as a checked whole number (a type modifier cannot be bound), as the pgvector driver does.
 *           An item without passages has no similar items. The `scope` option is ignored: isolation is the database's.
 * Runtime: node
 * Governing contract: ADR 0492 (decision 8: Postgres answers first, an image replaces it per tenant); ADR 0160 (raw SQL is
 *                     parameterised; pgvector is approved); ADR 0327 (decision 9); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";
import type { Database } from "@stackra/database";

import type { SearchConfig } from "#config/search.config";
import { Recommender } from "#contracts/ports/recommender.port";
import type { RecommendOptions } from "#contracts/types/recommend-options.type";
import type { Recommendation } from "#contracts/types/recommendation.type";
import { SEMANTIC_SOURCE } from "#core/constants/semantic-source.constant";

/** The vector table of migration 0002. */
const VECTOR_ITEMS = '"search"."vector_items"';

/** A `schema.table` or bare table name. */
const TABLE = /^[a-z_][a-z0-9_]*(\.[a-z_][a-z0-9_]*)?$/;

/** The nearest passages read per wanted item, before they are grouped by row (an item has several passages). */
const PASSAGES_PER_ITEM = 5;

/** A quoted identifier. */
const quote = (name: string): string => `"${name.replaceAll('"', '""')}"`;

/**
 * Recommends from Postgres.
 *
 * @example
 * const similar = await database.withScope(scope, () => recommender.similar(product.id, { limit: 8 }));
 */
export class PostgresRecommenderDriver extends Driver(Recommender) {
  /** The connected database. */
  private readonly database: Database;

  /** The embedding dimension of the deployment. */
  private readonly dimensions: number;

  /** The co-occurrence table, quoted; `null` when the host keeps none. */
  private readonly pairs: string | null;

  /** How many items one answer holds when the call names no limit. */
  private readonly limit: number;

  /**
   * @param database - the connected database whose running context each statement joins.
   * @param config - the search configuration: `embedder.dimensions` and `recommender` (`cooccurrence`, `limit`).
   * @throws RangeError when the dimension is not a whole number from 1.
   * @throws TypeError when the co-occurrence table is not a `schema.table` name.
   */
  constructor(database: Database, config: SearchConfig) {
    super();
    const { dimensions } = config.embedder;
    if (!Number.isInteger(dimensions) || dimensions < 1)
      throw new RangeError(
        `search.embedder.dimensions is a whole number from 1, got ${dimensions}`,
      );
    const { cooccurrence, limit } = config.recommender;
    if (cooccurrence !== null && !TABLE.test(cooccurrence))
      throw new TypeError(
        `search.recommender.cooccurrence is a table name (schema.table), got ${cooccurrence}`,
      );
    this.database = database;
    this.dimensions = dimensions;
    this.pairs = cooccurrence === null ? null : cooccurrence.split(".").map(quote).join(".");
    this.limit = limit;
  }

  /**
   * The items whose passages are nearest to `itemId`'s, best first (score is cosine similarity), never the item itself.
   *
   * @throws RangeError for a limit that is not a whole number from 1.
   */
  async similar(
    itemId: string,
    options: RecommendOptions = {},
  ): Promise<readonly Recommendation[]> {
    const limit = this.limitOf(options);
    const n = this.dimensions;
    // raw-sql: nearest-neighbour ordering by `<=>` has no ORM form (ADR 0160); the cast and the `vector_dims` predicate
    // match the partial HNSW index of dimension n, which orders the passages before they are grouped by row.
    const rows = (await this.database.em().execute(
      `select near.id, max(near.score) as score from (
  select v."metadata" ->> 'row' as id, 1 - ((v."embedding"::vector(${n})) <=> src.e) as score
  from ${VECTOR_ITEMS} v,
    (select "embedding"::vector(${n}) as e from ${VECTOR_ITEMS}
      where vector_dims("embedding") = ${n} and "metadata" @> ?::jsonb order by "id" limit 1) src
  where vector_dims(v."embedding") = ${n} and v."metadata" @> ?::jsonb and v."metadata" ->> 'row' <> ?
  order by (v."embedding"::vector(${n})) <=> src.e limit ?
) near
group by near.id
order by score desc, near.id
limit ?`,
      [
        JSON.stringify({ source: SEMANTIC_SOURCE, row: itemId }),
        JSON.stringify({ source: SEMANTIC_SOURCE }),
        itemId,
        limit * PASSAGES_PER_ITEM,
        limit,
      ],
    )) as unknown as readonly { readonly id: unknown; readonly score: unknown }[];
    return rows.map((row) => ({ id: String(row.id), score: Number(row.score) }));
  }

  /**
   * The items most often bought with `itemId` per the co-occurrence table, best score first; empty without a table.
   *
   * @throws RangeError for a limit that is not a whole number from 1.
   */
  async boughtTogether(
    itemId: string,
    options: RecommendOptions = {},
  ): Promise<readonly Recommendation[]> {
    const limit = this.limitOf(options);
    if (this.pairs === null) return [];
    // raw-sql: the table is the host's read model, whose name is configuration, not a model of this package
    const rows = (await this.database.em().execute(
      `select "other_id" as id, "score" from ${this.pairs}
where "item_id" = ? and "other_id" <> ?
order by "score" desc, "other_id"
limit ?`,
      [itemId, itemId, limit],
    )) as unknown as readonly { readonly id: unknown; readonly score: unknown }[];
    return rows.map((row) => ({ id: String(row.id), score: Number(row.score) }));
  }

  /**
   * The call's limit, or the default.
   *
   * @throws RangeError for a limit that is not a whole number from 1.
   */
  private limitOf(options: RecommendOptions): number {
    const limit = options.limit ?? this.limit;
    if (!Number.isInteger(limit) || limit < 1)
      throw new RangeError(`A recommendation limit is a whole number from 1, got ${limit}`);
    return limit;
  }
}
