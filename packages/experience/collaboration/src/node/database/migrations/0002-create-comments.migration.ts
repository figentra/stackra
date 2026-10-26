/**
 * Stackra file contract:
 * Purpose: the comment tables of the collaboration package (`collaboration.0002_create_comments`):
 *          `comment_threads`, `comments`, `comment_revisions` and `comment_mentions`, each under the generated scope
 *          policy.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. The commented record is a model key and public id, never a foreign key. Revisions keep their
 *           comment (no cascade: a comment is never removed, only tombstoned); mentions cascade with their comment.
 *           No `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0433 (decisions 1 to 3); ADR 0327 (decisions 3 and 9); ADR 0159 (as amended); ADR 0160
 *                     (approved extensions); `.agents/rules/tenancy.md` (point 3).
 */
import { type Blueprint, Extension, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the four comment tables. */
export class CreateCommentsMigration extends Migration {
  /** The extension, then each table with its indexes and policy. */
  up(schema: SchemaBuilder): void {
    schema.createExtension(Extension.Ltree);
    schema.create("comment_threads", (t: Blueprint) => {
      t.hasPublicId("cth");
      t.timestamps();
      t.scopeId().notNull().comment("The scope node the record belongs to.");
      t.scopePath().notNull().comment("That node's path, denormalised for row-level security.");
      t.string("record_model", 127).notNull().comment("The commented record's model key.");
      t.string("record_id", 64).notNull().comment("The commented record's public id.");
      t.string("anchor", 255).nullable().comment("Where in the record it is anchored.");
      t.enum("status", ["open", "resolved"]).notNull().default("open").comment("Open or resolved.");
      t.string("created_by", 64).notNull().comment("Who opened it.");
      t.timestamp("resolved_at").nullable().comment("When it was resolved.");
      t.string("resolved_by", 64).nullable().comment("Who resolved it.");
      t.index(["record_model", "record_id"]);
      t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
    });
    schema.create("comments", (t: Blueprint) => {
      t.hasPublicId("cmt");
      t.timestamps();
      t.belongsTo("comment_threads", { column: "thread_id" }).notNull().comment("Its thread.");
      t.scopeId().notNull().comment("The thread's scope node.");
      t.scopePath().notNull().comment("That node's path, denormalised for row-level security.");
      t.string("author_id", 64).notNull().comment("Who wrote it.");
      t.enum("visibility", ["internal", "shared"]).notNull().comment("Who may read it.");
      t.string("body").notNull().comment("The current text; personal data.");
      t.jsonb("mentions").notNull().default([]).comment("The current mentions, each target once.");
      t.timestamp("edited_at").nullable().comment("When the text last changed.");
      t.timestamp("tombstoned_at").nullable().comment("When it was deleted.");
      t.string("tombstoned_by", 64).nullable().comment("Who deleted it.");
      t.index(["thread_id", "created_at"]);
      t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
    });
    schema.create("comment_revisions", (t: Blueprint) => {
      t.hasPublicId("cmr");
      t.timestamps();
      t.belongsTo("comments", { column: "comment_id" }).notNull().comment("The comment.");
      t.scopeId().notNull().comment("The comment's scope node.");
      t.scopePath().notNull().comment("That node's path, denormalised for row-level security.");
      t.string("body").notNull().comment("The text before the edit; personal data.");
      t.string("edited_by", 64).notNull().comment("Who made the edit.");
      t.index(["comment_id", "created_at"]);
      t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
    });
    schema.create("comment_mentions", (t: Blueprint) => {
      t.hasPublicId("cmn");
      t.timestamps();
      t.belongsTo("comments", { column: "comment_id" })
        .notNull()
        .cascadeOnDelete()
        .comment("The comment.");
      t.string("thread_id", 33).notNull().comment("The comment's thread.");
      t.scopeId().notNull().comment("The comment's scope node.");
      t.scopePath().notNull().comment("That node's path, denormalised for row-level security.");
      t.enum("kind", ["member", "team", "role", "external_participant", "assistant"])
        .notNull()
        .comment("What the mention points at.");
      t.string("target_id", 64).nullable().comment("The target's id; null for the assistant.");
      t.index(["kind", "target_id"]);
      t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
    });
  }
}
