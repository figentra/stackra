/**
 * Stackra file contract:
 * Purpose: `PgvectorVectorIndexDriver`, the server's `VectorIndex`: passages in `search.vector_items` (this package's
 *          migration 0002), ranked by pgvector's cosine distance `<=>`.
 * Boundary: raw SQL on the running context's entity manager, so it joins the caller's transaction and scope session.
 *           The table forces row-level security on `scope_path` against the session's granted scopes
 *           (`Database.withScope`), so a write outside them fails and a read never sees another scope's passages; a
 *           query also narrows to the rows at or below its own scope node. It never opens a scope session itself: the
 *           scope a caller passes never widens what the session grants. Every value is a bound parameter; vectors are
 *           checked before they reach SQL. Ids are unique across the table, so a repeated id in one batch keeps its last
 *           item.
 * Runtime: node
 * Governing contract: ADR 0160 (raw SQL is parameterised; pgvector is approved); ADR 0327 (decision 9: isolation in the
 *                     database); `.agents/rules/tenancy.md` (point 3); ADR 0294 (decision 16); owner decision 23.
 */
import { Driver } from "@stackra/container";
import type { Database } from "@stackra/database";

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

  /** @param database - the connected database whose running context each statement joins. */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /** See `VectorIndex.upsert`. */
  async upsert(items: readonly VectorItem[]): Promise<void> {
    for (const item of items) checkVector(item.vector);
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
values ${unique.map(() => "(?, ?, ?::ltree, ?::vector, ?, ?::jsonb)").join(", ")}
on conflict ("id") do update set "scope_id" = excluded."scope_id", "scope_path" = excluded."scope_path", "embedding" = excluded."embedding", "text" = excluded."text", "metadata" = excluded."metadata", "updated_at" = now()`,
      params,
    );
  }

  /** See `VectorIndex.query`. */
  async query(
    vector: readonly number[],
    options: VectorQueryOptions,
  ): Promise<readonly VectorHit[]> {
    checkVector(vector);
    if (!Number.isInteger(options.topK) || options.topK < 1)
      throw new TypeError(`topK must be a whole number from 1, got ${options.topK}`);
    const literal = JSON.stringify(vector);
    const filtered = Object.keys(options.filter ?? {}).length > 0;
    // raw-sql: nearest-neighbour ordering by `<=>` has no ORM form (ADR 0160)
    // shortcut: an exact scan of the scope's rows (the column has no fixed dimension, so no HNSW index); add a
    // `vector(n)` column and an HNSW index once a deployment pins its embedder.
    const rows = (await this.database.em().execute(
      `select "id", 1 - ("embedding" <=> ?::vector) as "score", "text", "metadata"
from ${TABLE}
where "scope_path" <@ ?::ltree${filtered ? ` and "metadata" @> ?::jsonb` : ""}
order by "embedding" <=> ?::vector, "id"
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

  /** See `VectorIndex.remove`. */
  async remove(ids: readonly string[]): Promise<void> {
    if (ids.length === 0) return;
    // raw-sql: a delete by id of rows that are not a model's
    await this.database
      .em()
      .execute(`delete from ${TABLE} where "id" in (${ids.map(() => "?").join(", ")})`, [...ids]);
  }
}
