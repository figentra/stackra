/**
 * Stackra file contract:
 * Purpose: the second migration of the search package (`search.0002_create_vector_items`): the pgvector and `ltree`
 *          extensions and `search.vector_items`, the passages `PgvectorVectorIndexDriver` stores, under the generated
 *          scope policy.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. The blueprint has no vector column, so `embedding` is added by SQL right after the table, in the
 *           same transaction; it is `vector` with no fixed dimension, so one table serves any embedder (one per
 *           deployment) and has no HNSW index yet. Row-level security matches `scope_path` at or below the session's
 *           `app.scope_paths` (`Database.withScope`), so every read and write stays inside the granted subtrees.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended); ADR 0160 and ADR 0334 rule 3 (approved extensions through
 *                     `createExtension`); ADR 0327 (decisions 3 and 9); `.agents/rules/tenancy.md` (point 3); owner
 *                     decision 23.
 */
import { type Blueprint, Extension, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the vector item table. */
export class CreateVectorItemsMigration extends Migration {
  /** The extensions, the table with its policy, then its embedding column. */
  up(schema: SchemaBuilder): void {
    schema.createExtension(Extension.Vector);
    schema.createExtension(Extension.Ltree);
    schema.create("vector_items", (t: Blueprint) => {
      t.string("id", 200).notNull().comment("The passage's id, unique across the index.");
      t.primary(["id"]);
      t.timestamps();
      t.scopeId().notNull().comment("The scope node the passage belongs to.");
      t.scopePath().notNull().comment("That node's path, denormalised for row-level security.");
      t.string("text").notNull().comment("The text the embedding was made from.");
      t.jsonb("metadata")
        .notNull()
        .default({})
        .comment("Values a query filters on by equality, returned with a hit.");
      t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
    });
    schema.sql(`alter table "search"."vector_items" add column "embedding" vector not null`, {
      inverse: `alter table "search"."vector_items" drop column if exists "embedding"`,
    });
    schema.sql(
      `comment on column "search"."vector_items"."embedding" is 'The passage''s embedding, compared by cosine distance.'`,
      { inverse: `comment on column "search"."vector_items"."embedding" is null` },
    );
  }
}
