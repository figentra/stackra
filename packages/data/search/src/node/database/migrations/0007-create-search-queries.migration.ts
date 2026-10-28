/**
 * Stackra file contract:
 * Purpose: the seventh migration of the search package (`search.0007_create_search_queries`): the query log
 *          `search.queries`, one row per sampled search read or result click, with its model, normalised phrase (null
 *          when withheld), hit count, latency and the clicked id.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. Rows belong to a scope node and sit under the generated scope policy, so a scope reads only its
 *           own queries and its children's. The phrase is never personal by construction: `SearchIndex` withholds it
 *           for a model whose text holds a classified field or a phrase that looks personal. No `down()`: gen derives
 *           the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended); ADR 0327 (decisions 3 and 9); ADR 0341 and ADR 0380 (data classes); R-16
 *                     (every column has a comment and its nullability); data-layer gap se12 (stackra-326).
 */
import { type Blueprint, Extension, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the query log. */
export class CreateSearchQueriesMigration extends Migration {
  /** The extension, then the table with its indexes and policy. */
  up(schema: SchemaBuilder): void {
    schema.createExtension(Extension.Ltree);
    schema.create("queries", (t: Blueprint) => {
      t.uuid("id").notNull().comment("The entry's key, minted by the insert.");
      t.primary(["id"]);
      t.scopeId().notNull().comment("The scope node the read ran in.");
      t.scopePath().notNull().comment("That node's path, denormalised for row-level security.");
      t.string("model", 200).notNull().comment("The searched model's class name.");
      t.string("phrase", 500)
        .nullable()
        .comment("The normalised phrase; null when withheld as possibly personal.");
      t.integer("hits").nullable().comment("Rows the read returned; null for a click.");
      t.integer("latency_ms").nullable().comment("How long the read took; null for a click.");
      t.string("clicked_id", 64).nullable().comment("The result clicked; null for a read.");
      t.timestamp("searched_at").notNull().comment("When the read or click happened.");
      t.index(["model", "searched_at"]);
      t.index(["model", "phrase"]);
      t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
    });
  }
}
