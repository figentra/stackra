/**
 * Stackra file contract:
 * Purpose: the first tables of the achievements package: `achievements.award_kinds`, `achievements.awards` and
 *          `achievements.award_verifications`, with the `ltree` extension and the generated scope policy of the first
 *          two.
 * Boundary: a frozen snapshot of `achievements.award_kind`, `achievements.award` and
 *           `achievements.award_verification`, never edited once on main: it imports only @stackra/database and every
 *           name is a literal. `recipient_model` is text with no check constraint: recipient models are code, checked
 *           before a row is written. `rule_set_id` links `rules.rule_sets` with no foreign key (another module's
 *           table). Row-level security matches `scope_path` at or below the session's `app.scope_paths` on kinds and
 *           awards; `award_verifications` has none by ADR 0368 decision 5 (hash, award id and scope only). No
 *           `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0368 (decisions 1 to 5); ADR 0327 (decisions 3 and 9); ADR 0159 (as amended); ADR 0160
 *                     (approved extensions); `.agents/rules/tenancy.md` (points 3 and 5).
 */
import { type Blueprint, Extension, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the kind, award and verification tables. */
export class CreateAchievementsMigration extends Migration {
  /** The extension, then each table with its indexes and policy. */
  up(schema: SchemaBuilder): void {
    schema.createExtension(Extension.Ltree);
    schema.create("award_kinds", (t: Blueprint) => {
      t.hasPublicId("awk");
      t.timestamps();
      t.scopeId().notNull().comment("The scope node the kind belongs to.");
      t.scopePath().notNull().comment("That node's path, denormalised for row-level security.");
      t.string("key", 63).notNull().comment("The kind's stable key in its scope.");
      t.string("name", 120).notNull().comment("The kind's display name.");
      t.string("recipient_model", 127)
        .notNull()
        .comment("The key of the model its awards are granted to.");
      t.jsonb("levels").notNull().default([]).comment("Its levels, lowest first.");
      t.boolean("is_ascending")
        .notNull()
        .default(false)
        .comment("Whether a recipient's next level must be above the highest it holds.");
      t.boolean("is_once_per_period")
        .notNull()
        .default(false)
        .comment("Whether a recipient holds at most one live award of the kind per period.");
      t.link("rule_set_id")
        .nullable()
        .comment("The rule set whose published revision grants the kind automatically.");
      t.string("certificate_template", 127)
        .nullable()
        .comment("The documents template key of its certificate.");
      t.boolean("is_active").notNull().default(true).comment("Whether the kind is still granted.");
      t.unique(["scope_id", "key"]);
      t.index(["recipient_model", "is_active"]);
      t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
    });
    schema.create("awards", (t: Blueprint) => {
      t.hasPublicId("awd");
      t.timestamps();
      t.belongsTo("award_kinds", { column: "kind_id" }).notNull().comment("Its kind.");
      t.scopeId().notNull().comment("The scope node it was granted in.");
      t.scopePath().notNull().comment("That node's path, denormalised for row-level security.");
      t.string("recipient_model", 127).notNull().comment("The recipient model's key.");
      t.string("recipient_id", 33).notNull().comment("The recipient's public id.");
      t.string("level", 120).nullable().comment("The level granted.");
      t.string("period", 60).nullable().comment("The period granted for.");
      t.string("reason", 1000)
        .nullable()
        .comment("Why it was granted, as the granting person wrote it.");
      t.string("granted_by", 64)
        .nullable()
        .comment("The principal who granted it; null for its criteria.");
      t.integer("rule_revision").nullable().comment("The criteria revision that matched.");
      t.string("verify_token", 64).notNull().comment("The opaque verify token on its certificate.");
      t.timestamp("revoked_at").nullable().comment("When it was revoked.");
      t.string("revoked_reason", 1000).nullable().comment("Why it was revoked.");
      t.index(["recipient_model", "recipient_id"]);
      t.index(["kind_id", "recipient_id"]);
      t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
    });
    schema.create("award_verifications", (t: Blueprint) => {
      t.hasPublicId("awv");
      t.timestamps();
      t.string("token_hash", 64)
        .notNull()
        .comment("The SHA-256 of the verify token, lowercase hex.");
      t.belongsTo("awards", { column: "award_id" })
        .notNull()
        .cascadeOnDelete()
        .comment("The award the token verifies.");
      t.scopeId().notNull().comment("The award's scope node.");
      t.scopePath().notNull().comment("That node's path, the scope session a verify opens.");
      t.unique(["token_hash"]);
    });
  }
}
