/**
 * Stackra file contract:
 * Purpose: the sixth migration of the search package (`search.0006_add_search_index_version`): the `version` column
 *          of the index registry `search.indexes`, the index version a versioned rebuild builds or last built.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. An expand step on an existing table: the column is nullable (null for a rebuild of the live index),
 *           so no row needs a value. No `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended); ADR 0221 (decision 7: versioned index swap); R-16 (every column has a
 *                     comment and its nullability); stackra-303.
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Adds the index version to the registry. */
export class AddSearchIndexVersionMigration extends Migration {
  /** The nullable version column. */
  up(schema: SchemaBuilder): void {
    schema.table("indexes", (t: Blueprint) => {
      t.integer("version")
        .nullable()
        .comment(
          "The index version a versioned rebuild builds or last built; null for the live index.",
        );
    });
  }
}
