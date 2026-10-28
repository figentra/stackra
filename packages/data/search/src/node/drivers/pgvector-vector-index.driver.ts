/**
 * Stackra file contract:
 * Purpose: `PgvectorVectorIndexDriver`, the server's `VectorIndex`: passages in `search.vector_items` (this package's
 *          migration 0002), ranked by pgvector's cosine distance `<=>` at the deployment's fixed embedding dimension
 *          (config `search.embedder.dimensions`), so the HNSW index of that dimension serves the query.
 * Boundary: raw SQL on the running context's entity manager, so it joins the caller's transaction and scope session.
 *           The table forces row-level security on `scope_path` against the session's granted scopes
 *           (`Database.withScope`), so a write outside them fails and a read never sees another scope's passages; a
 *           query also narrows to the rows at or below its own scope node. It never opens a scope session itself: the
 *           scope a caller passes never widens what the session grants. Every value is a bound parameter; vectors are
 *           checked before they reach SQL, and one whose length is not the configured dimension is refused. Ids are
 *           unique across the table, so a repeated id in one batch keeps its last item. The column itself has no fixed
 *           dimension (migration 0002); a query reads `"embedding"::vector(n)` among the rows of dimension `n`, the
 *           expression and predicate of the partial HNSW index (migration 0004 for the shipped 1024; a deployment with
 *           another dimension adds the same index at its `n` in its own migration). `n` is written into the SQL as a
 *           checked whole number, never a caller's value, because a type modifier and a partial-index predicate cannot
 *           be bound.
 * Runtime: node
 * Governing contract: ADR 0160 (raw SQL is parameterised; pgvector is approved); ADR 0327 (decision 9: isolation in the
 *                     database); `.agents/rules/tenancy.md` (point 3); ADR 0294 (decision 16); owner decision 23; STA-1251 (the fixed-dimension HNSW index);
 *                     stackra-301 (`metadataOf`).
 */
import { Driver } from "@stackra/container";
import type { Database } from "@stackra/database";

import type { SearchConfig } from "#config/search.config";
import { VectorIndex } from "#contracts/index";
import type { VectorHit, VectorItem, VectorQueryOptions } from "#contracts/index";
import { checkVector } from "#core/functions/check-vector.function";

/** The table of migration 0002. */
const TABLE = '"search"."vector_items"';

/**
 * Stores and queries vectors with pgvector.
 *
 * @example
 * await database.withScope(scope, () => index.query(vector, { topK: 5, scope }));
 */
export class PgvectorVectorIndexDriver extends Driver(VectorIndex) {
  /** The connected database. */
  private readonly database: Database;

  /** The embedding dimension of the deployment, which every stored and queried vector has. */
  private readonly dimensions: number;

  /**
   * @param database - the connected database whose running context each statement joins.
   * @param config - the search configuration; `embedder.dimensions` fixes the vector size.
   * @throws RangeError when the configured dimension is not a whole number from 1.
   */
  constructor(database: Database, config: SearchConfig) {
    super();
    const { dimensions } = config.embedder;
    if (!Number.isInteger(dimensions) || dimensions < 1)
      throw new RangeError(
        `search.embedder.dimensions is a whole number from 1, got ${dimensions}`,
      );
    this.database = database;
    this.dimensions = dimensions;
  }

  /**
   * Stores each item, replacing an item with the same id.
   *
   * @throws TypeError for a vector that is not finite numbers of the configured dimension.
   */
  async upsert(items: readonly VectorItem[]): Promise<void> {
    for (const item of items) this.check(item.vector);
    const unique = [...new Map(items.map((item) => [item.id, item])).values()];
    if (unique.length === 0) return;
    const params = unique.flatMap((item) => [
      item.id,
      item.scope.id,
      item.scope.path,
      JSON.stringify(item.vector),
      item.text,
      JSON.stringify(item.metadata),
    ]);
    // raw-sql: pgvector's vector type and an upsert of many rows have no ORM form (ADR 0160)
    // shortcut: one statement per call; split into batches once a call carries thousands of passages.
    await this.database.em().execute(
      `insert into ${TABLE} ("id", "scope_id", "scope_path", "embedding", "text", "metadata")
values ${unique.map(() => `(?, ?, ?::ltree, ?::vector(${this.dimensions}), ?, ?::jsonb)`).join(", ")}
on conflict ("id") do update set "scope_id" = excluded."scope_id", "scope_path" = excluded."scope_path", "embedding" = excluded."embedding", "text" = excluded."text", "metadata" = excluded."metadata", "updated_at" = now()`,
      params,
    );
  }

  /**
   * The `topK` items nearest to `vector`, best first, within the scope and matching the filter.
   *
   * @throws TypeError for a vector that is not finite numbers of the configured dimension, or a bad `topK`.
   */
  async query(
    vector: readonly number[],
    options: VectorQueryOptions,
  ): Promise<readonly VectorHit[]> {
    this.check(vector);
    if (!Number.isInteger(options.topK) || options.topK < 1)
      throw new TypeError(`topK must be a whole number from 1, got ${options.topK}`);
    const literal = JSON.stringify(vector);
    const filtered = Object.keys(options.filter ?? {}).length > 0;
    const n = this.dimensions;
    // raw-sql: nearest-neighbour ordering by `<=>` has no ORM form (ADR 0160); the cast and the `vector_dims`
    // predicate match the partial HNSW index of dimension n, so the planner can use it.
    // shortcut: HNSW filters after the scan, so a narrow scope or filter can return fewer than topK; turn on pgvector's
    // `hnsw.iterative_scan` when a deployment sees short pages.
    const rows = (await this.database.em().execute(
      `select "id", 1 - (("embedding"::vector(${n})) <=> ?::vector(${n})) as "score", "text", "metadata"
from ${TABLE}
where vector_dims("embedding") = ${n} and "scope_path" <@ ?::ltree${filtered ? ` and "metadata" @> ?::jsonb` : ""}
order by ("embedding"::vector(${n})) <=> ?::vector(${n}), "id"
limit ?`,
      [
        literal,
        options.scope.path,
        ...(filtered ? [JSON.stringify(options.filter)] : []),
        literal,
        options.topK,
      ],
    )) as unknown as readonly {
      readonly id: unknown;
      readonly score: unknown;
      readonly text: unknown;
      readonly metadata: VectorHit["metadata"];
    }[];
    return rows.map((row) => ({
      id: String(row.id),
      score: Number(row.score),
      text: String(row.text),
      metadata: row.metadata,
    }));
  }

  /** Removes the items of `ids`; an unknown id is ignored. */
  async remove(ids: readonly string[]): Promise<void> {
    if (ids.length === 0) return;
    // raw-sql: a delete by id of rows that are not a model's
    await this.database
      .em()
      .execute(`delete from ${TABLE} where "id" in (${ids.map(() => "?").join(", ")})`, [...ids]);
  }

  /** The stored metadata of each of `ids` the session can see, by id; an unknown id has no entry. */
  override async metadataOf(
    ids: readonly string[],
  ): Promise<ReadonlyMap<string, VectorItem["metadata"]>> {
    if (ids.length === 0) return new Map();
    // raw-sql: a read by id of rows that are not a model's
    const rows = (await this.database
      .em()
      .execute(
        `select "id", "metadata" from ${TABLE} where "id" in (${ids.map(() => "?").join(", ")})`,
        [...ids],
      )) as unknown as readonly {
      readonly id: unknown;
      readonly metadata: VectorItem["metadata"];
    }[];
    return new Map(rows.map((row) => [String(row.id), row.metadata]));
  }

  /**
   * Refuses a vector this index cannot store or compare.
   *
   * @throws TypeError when `vector` is not finite numbers, or its length is not the configured dimension.
   */
  private check(vector: readonly number[]): void {
    checkVector(vector);
    if (vector.length !== this.dimensions)
      throw new TypeError(
        `A vector here has ${this.dimensions} numbers (search.embedder.dimensions), got ${vector.length}`,
      );
  }
}
