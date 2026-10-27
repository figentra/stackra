/**
 * Stackra file contract:
 * Purpose: the second migration of the ai package (`ai.0002_drop_embeddings`): drops `ai.embeddings`, the ai package's
 *          own pgvector table, so the platform keeps one vector store: `search.vector_items` behind the `VectorIndex`
 *          port of @stackra/search, which `retrieve()` already reads.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and the statement is a
 *           literal. No code ever wrote the table (the `Embedding` model had no writer), so nothing is copied over;
 *           conversation memory stores through `VectorIndex.upsert` with the conversation and message ids, the
 *           embedder and the content hash as item metadata. Not reversible (`inverse: false`): the dev inverse is to
 *           re-run 0001 on a fresh schema. The table's tenant policy and indexes go with it.
 * Runtime: node
 * Governing contract: ADR 0465 (one vector store); ADR 0159 (as amended: snapshots); ADR 0160 (pgvector); ADR 0399.
 */
import { Migration, type SchemaBuilder } from "@stackra/database";

/** Drops the ai package's own embeddings table. */
export class DropEmbeddingsMigration extends Migration {
  /** The drop, with no inverse. */
  up(schema: SchemaBuilder): void {
    schema.sql(`drop table if exists "ai"."embeddings"`, { inverse: false });
  }
}
