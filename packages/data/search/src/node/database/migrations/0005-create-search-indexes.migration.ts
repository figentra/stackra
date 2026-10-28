/**
 * Stackra file contract:
 * Purpose: the fifth migration of the search package (`search.0005_create_search_indexes`): the index registry
 *          `search.indexes`, one row per model and scope with its state, the facet hash of its last rebuild, its
 *          document count, the resume cursor of a rebuild in progress and when it was last fully rebuilt.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. The registry is the platform's, written by reindex jobs in every scope and read by
 *           `search:status`, so it has no row-level-security policy, like `queue.jobs`; it holds no row data, only
 *           counts. `scope_key` is the scope id, or `-` for a platform-wide index, so the key never holds a null. No
 *           `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended); ADR 0404 (decision 3); ADR 0221 (decision 7); R-16 (every column has a
 *                     comment and its nullability).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the index registry. */
export class CreateSearchIndexesMigration extends Migration {
  /** The registry table and its key. */
  up(schema: SchemaBuilder): void {
    schema.create("indexes", (t: Blueprint) => {
      t.string("model", 200).notNull().comment("The model's class name, as a row change names it.");
      t.string("scope_key", 33)
        .notNull()
        .comment("The scope id the index serves, or - for a platform-wide index.");
      t.primary(["model", "scope_key"]);
      t.timestamps();
      t.string("scope_id", 33)
        .nullable()
        .comment("The public id of the scope node the index serves.");
      t.string("scope_path").nullable().comment("The materialised path of that scope node.");
      t.enum("state", ["valid", "invalid", "rebuilding"])
        .notNull()
        .comment("Whether the documents match the facet, the facet changed, or a rebuild runs.");
      t.string("facet_hash", 64)
        .notNull()
        .comment("The SHA-256 of the @Searchable facet the last rebuild indexed with.");
      t.integer("doc_count").notNull().default(0).comment("Documents the last rebuild indexed.");
      t.string("cursor").nullable().comment("The primary key a stopped rebuild resumes after.");
      t.timestamp("rebuilt_at").nullable().comment("When the last full rebuild finished.");
    });
  }
}
