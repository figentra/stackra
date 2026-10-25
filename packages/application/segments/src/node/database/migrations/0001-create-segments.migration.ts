/**
 * Stackra file contract:
 * Purpose: the first tables of the segments package: `segments.segments` and `segments.segment_memberships`, with the
 *          `ltree` extension and the generated scope policy of each.
 * Boundary: a frozen snapshot of `segments.segment` and `segments.segment_membership`, never edited once on main: it
 *           imports only @stackra/database and every name is a literal. `subject_model` is text with no check
 *           constraint: subject models are code, checked before a row is written. `rule_set_id` links
 *           `rules.rule_sets` with no foreign key (another module's table). Row-level security matches `scope_path`
 *           at or below the session's `app.scope_paths` (`Database.withScope`) on both tables, so every read and write
 *           stays inside the granted subtrees; the recompute job and the change consumer run in a scope session too, so
 *           nothing reads across scopes. No `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0332 (decisions 1 to 3); ADR 0327 (decisions 3 and 9); ADR 0159 (as amended); ADR 0160
 *                     (approved extensions); `.agents/rules/tenancy.md` (point 3).
 */
import { type Blueprint, Extension, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the segment and membership tables. */
export class CreateSegmentsMigration extends Migration {
  /** The extension, then each table with its indexes and policy. */
  up(schema: SchemaBuilder): void {
    schema.createExtension(Extension.Ltree);
    schema.create("segments", (t: Blueprint) => {
      t.hasPublicId("seg");
      t.timestamps();
      t.scopeId().notNull().comment("The scope node the segment belongs to.");
      t.scopePath().notNull().comment("That node's path, denormalised for row-level security.");
      t.string("name", 120).notNull().comment("The segment's display name.");
      t.string("subject_model", 127)
        .notNull()
        .comment("The key of the model its members are records of.");
      t.enum("kind", ["dynamic", "manual"])
        .notNull()
        .comment("Whether its rule set or a person decides its members.");
      t.link("rule_set_id")
        .nullable()
        .comment("A dynamic segment's rule set; null for a manual one.");
      t.integer("revision")
        .nullable()
        .comment("The rule set revision the membership was last fully computed from.");
      t.timestamp("computed_at").nullable().comment("When the membership was last fully computed.");
      t.index(["subject_model", "kind"]);
      t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
    });
    schema.create("segment_memberships", (t: Blueprint) => {
      t.hasPublicId("sgm");
      t.timestamps();
      t.belongsTo("segments", { column: "segment_id" })
        .notNull()
        .cascadeOnDelete()
        .comment("The segment.");
      t.scopeId().notNull().comment("The segment's scope node.");
      t.scopePath().notNull().comment("That node's path, denormalised for row-level security.");
      t.string("subject_model", 127).notNull().comment("The subject model's key.");
      t.string("subject_id", 33).notNull().comment("The subject's public id.");
      t.unique(["segment_id", "subject_id"]);
      t.index(["subject_model", "subject_id"]);
      t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
    });
  }
}
