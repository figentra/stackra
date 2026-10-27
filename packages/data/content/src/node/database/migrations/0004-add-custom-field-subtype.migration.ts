/**
 * Stackra file contract:
 * Purpose: the `subtype` column of `content.custom_fields`, so a model's records split into types defined at runtime
 *          (a content type key) each carry their own definitions, and the unique index that now includes it.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. Expand-only: the column is not null with the default `''` (the whole model, which every existing
 *           row is), the new unique index builds concurrently first, then the old one is dropped concurrently. No
 *           `down()`: gen derives the dev inverse; the dropped index's inverse recreates it.
 * Runtime: node
 * Governing contract: ADR 0116 (decision CT2) as amended by ADR 0226 (types are data); ADR 0159 (as amended: expand-only
 *                     adds, online indexes).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Adds the subtype column and moves the definition key's uniqueness to include it. */
export class AddCustomFieldSubtypeMigration extends Migration {
  /** The column and the new unique index, then the old index goes. */
  up(schema: SchemaBuilder): void {
    schema.table("custom_fields", (t: Blueprint) => {
      t.string("subtype", 63)
        .notNull()
        .default("")
        .comment("The runtime type of the model the field belongs to; empty for the whole model.");
      t.unique(["scope_id", "model", "subtype", "key"]).concurrently();
    });
    schema.sql(
      `drop index concurrently if exists "content"."idx_custom_fields_scope_id_model_key"`,
      {
        inverse: `create unique index concurrently if not exists "idx_custom_fields_scope_id_model_key" on "content"."custom_fields" ("scope_id", "model", "key")`,
      },
    );
  }
}
