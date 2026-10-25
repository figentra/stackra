/**
 * Stackra file contract:
 * Purpose: the first tables of the content package: `content.custom_fields` (the definitions) and
 *          `content.custom_field_value_sets` (the side table of values, one row per record), with the `ltree`
 *          extension, their unique indexes and their generated scope policies.
 * Boundary: a frozen snapshot of `content.custom_field` and `content.custom_field_value_set`, never edited once on
 *           main: it imports only @stackra/database and every name is a literal. `type` is text with no check
 *           constraint: the registered types are code, checked by @stackra/content before a row is written. Row-level
 *           security matches `scope_path` at or below the session's `app.scope_paths` (`Database.withScope`), so a
 *           session reads and writes only inside its granted subtrees. No `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0116 (decision CT2); ADR 0327 (decisions 3 and 9); ADR 0159 (as amended); ADR 0160
 *                     (approved extensions); `.agents/rules/tenancy.md` (point 3).
 */
import { type Blueprint, Extension, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the definition and value tables. */
export class CreateCustomFieldsMigration extends Migration {
  /** The extension, then each table with its indexes and policy. */
  up(schema: SchemaBuilder): void {
    schema.createExtension(Extension.Ltree);
    schema.create("custom_fields", (t: Blueprint) => {
      t.hasPublicId("cfd");
      t.timestamps();
      t.scopeId().notNull().comment("The scope node the field is defined at.");
      t.scopePath().notNull().comment("That node's path, denormalised for row-level security.");
      t.string("model", 127).notNull().comment("The key of the model the field extends.");
      t.string("key", 63).notNull().comment("The value's camelCase key on a record.");
      t.string("type", 31).notNull().comment("The registered field type.");
      t.translatable(["label"]).notNull().comment("The field's label per locale.");
      t.boolean("required")
        .notNull()
        .default(false)
        .comment("Whether every record must carry a value.");
      t.jsonb("rules").notNull().default({}).comment("The type's choices and bounds.");
      t.unique(["scope_id", "model", "key"]);
      t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
    });
    schema.create("custom_field_value_sets", (t: Blueprint) => {
      t.hasPublicId("cfv");
      t.timestamps();
      t.scopeId().notNull().comment("The scope node of the record.");
      t.scopePath().notNull().comment("That node's path, denormalised for row-level security.");
      t.string("model", 127).notNull().comment("The key of the record's model.");
      t.string("record_id", 33).notNull().comment("The record's public id.");
      t.jsonb("values")
        .notNull()
        .default({})
        .comment("The record's custom field values by field key.");
      t.unique(["model", "record_id"]);
      t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
    });
  }
}
