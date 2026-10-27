/**
 * Stackra file contract:
 * Purpose: the third migration of the rules package: the `rules.condition_fields` table, the cross-service registry of
 *          the fields a stored condition may test, one row per model, source and field.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. A platform table: no scope column, so no row-level security. Additive. No `down()`: gen derives
 *           the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0331 (decisions 4 and 11); ADR 0159 (as amended); R-16 (every column has a comment and its
 *                     nullability); STA-817 and STA-1250.
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the registry table. */
export class CreateConditionFieldsMigration extends Migration {
  /** One table and its unique field per model and source. */
  up(schema: SchemaBuilder): void {
    schema.create("condition_fields", (t: Blueprint) => {
      t.hasPublicId("rcf");
      t.timestamps();
      t.string("model", 127)
        .notNull()
        .comment("The model whose conditions test the field (orders.order).");
      t.string("source", 63).notNull().comment("The fact source the field belongs to (record).");
      t.string("field", 63).notNull().comment("The camelCase field key (channelId).");
      t.string("type", 31).notNull().comment("The rules field type, which fixes the operators.");
      t.string("label", 255)
        .notNull()
        .comment("The owning service's lang key of the field's name.");
      t.jsonb("values")
        .nullable()
        .comment("An enum field's codes to their lang keys; null otherwise.");
      t.unique(["model", "source", "field"]);
    });
  }
}
