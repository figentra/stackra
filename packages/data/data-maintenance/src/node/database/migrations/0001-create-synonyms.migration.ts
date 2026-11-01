/**
 * Stackra file contract:
 * Purpose: the first migration of the data-maintenance package (`data_maintenance.0001_create_synonyms`): the tenant's synonym sets table
 *          `data_maintenance.synonyms`, one row per equivalence set of an index and language.
 * Boundary: a frozen snapshot of `data_maintenance.synonym`, never edited once on main: it imports only @stackra/database and
 *           every name is a literal. Every column states its nullability and a comment equal to the model field's
 *           docblock. `belongsToTenant` (@stackra/tenancy) writes the tenant column, its index and the forced equality
 *           policy `pol_synonyms_tenant_id`, so a session sees its own tenant's sets only. No `down()`: gen derives the
 *           dev inverse, and production is forward only.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended: snapshots, partner macros, comments and nullability); ADR 0239; ADR 0231
 *                     (index names); R-16 (every column has a comment and its nullability); ADR 0492 (decision 5).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the synonym table. */
export class CreateSynonymsMigration extends Migration {
  /** The table with its tenant policy and lookup index. */
  up(schema: SchemaBuilder): void {
    schema.create("synonyms", (t: Blueprint) => {
      t.hasPublicId("syn");
      t.belongsToTenant();
      t.timestamps();
      t.string("index_name", 120)
        .notNull()
        .comment(
          "The index (the searched model's table, bare or schema-qualified) the set applies to.",
        );
      t.string("language", 3)
        .notNull()
        .comment("The language subtag (`ar`, `en`) the set applies to.");
      t.jsonb("terms").notNull().comment("The terms that find each other, two to sixteen.");
      t.index(["tenant_id", "index_name", "language"]);
    });
  }
}
