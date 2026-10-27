/**
 * Stackra file contract:
 * Purpose: the fourth migration of the search package (`search.0004_create_vector_hnsw_index`): the partial HNSW index
 *          of `search.vector_items` for 1024-number embeddings (the shipped `search.embedder.dimensions`), by cosine
 *          distance, so `PgvectorVectorIndexDriver` stops scanning every row of a scope.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and the statement is a
 *           literal. The column has no fixed dimension (migration 0002), so the index is on the expression
 *           `"embedding"::vector(1024)` over the rows where `vector_dims("embedding") = 1024`, which is the exact
 *           expression and predicate the driver queries with. A deployment whose embedder returns another size adds the
 *           same statement at its size in its own migration (`vector_items_embedding_hnsw_<n>`); pgvector indexes up to
 *           2000 dimensions. Built inside the migration's transaction, which locks writes to the table while it builds.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended); ADR 0160 (pgvector is approved); owner decision 23; STA-1251.
 */
import { Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the HNSW index of the shipped embedding dimension. */
export class CreateVectorHnswIndexMigration extends Migration {
  /** The index, with its inverse. */
  up(schema: SchemaBuilder): void {
    schema.sql(
      `create index if not exists "vector_items_embedding_hnsw_1024" on "search"."vector_items" using hnsw (("embedding"::vector(1024)) vector_cosine_ops) where vector_dims("embedding") = 1024`,
      { inverse: `drop index if exists "search"."vector_items_embedding_hnsw_1024"` },
    );
  }
}
