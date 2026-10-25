/**
 * Stackra file contract:
 * Purpose: the third migration of the workflow package: `workflow.automations`, a scope's automations, with their
 *          generated scope policy.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. The documents are revisions in `content.revisions`, @stackra/content's table. Unlike the journal,
 *           automations are tenant data: row-level security matches `scope_path` at or below the session's
 *           `app.scope_paths`, so a trigger's delivery finds only its own scope's automations. No `down()`: gen derives
 *           the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0122 (decision 3); ADR 0153 (decision 2); ADR 0327 (decisions 3 and 9); ADR 0159 (as
 *                     amended); R-16 (every column has a comment and its nullability).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the automation table. */
export class CreateAutomationsMigration extends Migration {
  /** The table, its indexes and its policy. */
  up(schema: SchemaBuilder): void {
    schema.create("automations", (t: Blueprint) => {
      t.hasPublicId("wfa");
      t.timestamps();
      t.scopeId().notNull().comment("The scope node the automation belongs to.");
      t.scopePath().notNull().comment("That node's path, denormalised for row-level security.");
      t.string("key", 127).notNull().comment("The key every revision's document carries.");
      t.string("trigger", 255)
        .nullable()
        .comment("The trigger block of the published revision; null while unpublished.");
      t.integer("published_revision")
        .nullable()
        .comment("The revision in force; null until published.");
      t.integer("dry_run_revision")
        .nullable()
        .comment("The revision a dry run last covered, the one that may be published.");
      t.jsonb("principal")
        .nullable()
        .comment("The principal the published automation runs as: its kind and public id.");
      t.string("seed_version", 31)
        .nullable()
        .comment("The workflow template pack version it was seeded from; null for a tenant's own.");
      t.unique(["scope_id", "key"]);
      t.index(["trigger"]).where("published_revision is not null");
      t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
    });
  }
}
