/**
 * Stackra file contract:
 * Purpose: the sixth migration of the workflow package: `workflow.checklists`, a scope's copy of each product checklist
 *          with its customization, and `workflow.checklist_progress`, each completed step per scope or user, both with
 *          their generated scope policy.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. Tenant data: row-level security matches `scope_path` at or below the session's `app.scope_paths`.
 *           No `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0424 (decisions 1 and 2); ADR 0327 (decisions 3 and 9); ADR 0159 (as amended); R-16 (every
 *                     column has a comment and its nullability).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the checklist tables. */
export class CreateChecklistsMigration extends Migration {
  /** Two tables, their keys and their policies. */
  up(schema: SchemaBuilder): void {
    schema.create("checklists", (t: Blueprint) => {
      t.hasPublicId("wfc");
      t.timestamps();
      t.scopeId().notNull().comment("The scope node the checklist belongs to.");
      t.scopePath().notNull().comment("That node's path, denormalised for row-level security.");
      t.string("key", 127)
        .notNull()
        .comment("The template key, workflow-template:<product>:<name>.");
      t.jsonb("template").notNull().comment("The checklist template as last seeded.");
      t.jsonb("hidden").notNull().comment("The unlocked steps the scope hides.");
      t.jsonb("order").notNull().comment("The scope's order of its unlocked steps.");
      t.string("profile", 127)
        .nullable()
        .comment("The industry profile applied at sign-up; null when none was.");
      t.boolean("customized")
        .notNull()
        .default(false)
        .comment("Whether the scope changed the customization itself.");
      t.unique(["scope_id", "key"]);
      t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
    });
    schema.create("checklist_progress", (t: Blueprint) => {
      t.hasPublicId("wfp");
      t.timestamps();
      t.scopeId().notNull().comment("The scope node the progress belongs to.");
      t.scopePath().notNull().comment("That node's path, denormalised for row-level security.");
      t.string("checklist_id", 31).notNull().comment("The scope's checklist (wfc_...).");
      t.string("step", 63).notNull().comment("The completed step's key.");
      t.string("owner_id", 63)
        .notNull()
        .comment("Whose progress: the scope id for a scope step, the user id for a user step.");
      t.jsonb("completed_by")
        .notNull()
        .comment("Who completed it: the actor's kind and public id.");
      t.unique(["checklist_id", "step", "owner_id"]);
      t.index(["checklist_id", "owner_id"]);
      t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
    });
  }
}
