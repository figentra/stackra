/**
 * Stackra file contract:
 * Purpose: the saved view table of the panel package, `panel.stored_views`, with its tenant policy, version column and
 *          lookup indexes.
 * Boundary: a frozen snapshot of `panel.stored_view`, never edited once on main: it imports only @stackra/database and
 *           every name is a literal. Every column states its nullability and a comment equal to the model field's
 *           docblock. `belongsToTenant` (@stackra/tenancy) writes the tenant column, its index and the forced equality
 *           policy `pol_stored_views_tenant_id`; `versioned` the optimistic concurrency column. No `down()`: gen derives
 *           the dev inverse, and production is forward only.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended: snapshots, partner macros, comments and nullability); ADR 0239; ADR 0231
 *                     (index names); ADR 0271 (decision 8: optimistic concurrency).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the saved view table. */
export class CreateStoredViewsMigration extends Migration {
  /** The table with its policy, version column and indexes. */
  up(schema: SchemaBuilder): void {
    schema.create("stored_views", (t: Blueprint) => {
      t.hasPublicId("view");
      t.belongsToTenant();
      t.versioned();
      t.timestamps();
      t.string("resource", 200)
        .notNull()
        .comment("The resource key the view lists (`orders.order`).");
      t.string("name", 120).notNull().comment("The name the owner gave it.");
      t.string("owner", 64).notNull().comment("The owner's principal id.");
      t.enum("sharing", ["private", "scope", "role"])
        .notNull()
        .comment("Who sees it: the owner, a role's holders or the whole scope.");
      t.string("role", 200).nullable().comment("The role key of a role copy.");
      t.enum("layout", ["table", "board", "gallery", "calendar", "chart"])
        .notNull()
        .comment("How the rows are drawn.");
      t.string("layout_by", 200)
        .nullable()
        .comment("The row path a board groups by or a calendar places by.");
      t.jsonb("filter").notNull().comment("The filter values by row path.");
      t.jsonb("sort").nullable().comment("The sort, when it differs from the table's default.");
      t.jsonb("columns").nullable().comment("The row paths shown, in order.");
      t.jsonb("group").nullable().comment("The group key and its sub-group key.");
      t.jsonb("totals").notNull().comment("The totals per group.");
      t.index(["tenant_id", "resource", "owner"]);
      t.index(["tenant_id", "resource", "sharing"]);
    });
  }
}
