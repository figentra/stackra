/**
 * Stackra file contract:
 * Purpose: the second table of the settings package, `settings.stored_setting_revisions`: one row per recorded
 *          settings change, with the holder columns, the change and its audit fields, an index for a holder's history
 *          and one for the due scheduled revisions.
 * Boundary: a frozen snapshot of `settings.stored_setting_revision`, never edited once on main: it imports only
 *           @stackra/database and every name is a literal. No row-level-security policy, as for `stored_settings`
 *           (0001): the scheduler reads due revisions across holders, and reads otherwise name their holder in
 *           `StoredSettingRevisionService`. No `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0213 (decision 5); ADR 0327 (decisions 3 and 9); ADR 0159 (as amended).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the revisions table. */
export class CreateStoredSettingRevisionsMigration extends Migration {
  /** The table with its indexes. */
  up(schema: SchemaBuilder): void {
    schema.create("stored_setting_revisions", (t: Blueprint) => {
      t.hasPublicId("ssr");
      t.timestamps();
      t.string("group_key", 63).notNull().comment("The settings group, which is the module key.");
      t.scopeId().nullable().comment("The node of a node revision.");
      t.scopePath().nullable().comment("That node's path.");
      t.string("user_id", 33).nullable().comment("The user of a user revision.");
      t.jsonb("values").notNull().default({}).comment("The values it sets, by path in the group.");
      t.jsonb("removed").notNull().default([]).comment("The paths it removes.");
      t.jsonb("locked").nullable().comment("The written paths it locks; null keeps each lock.");
      t.jsonb("previous")
        .notNull()
        .default({})
        .comment("The values of the changed paths before it.");
      t.string("author", 64).notNull().comment("The principal who made it.");
      t.string("reason", 1000).nullable().comment("Why, as the author wrote it.");
      t.string("environment", 16).notNull().comment("live, sandbox or setup.");
      t.boolean("break_glass")
        .notNull()
        .default(false)
        .comment("A change to live outside promotion.");
      t.string("status", 16).notNull().comment("pending, scheduled, applied or rejected.");
      t.timestamp("effective_at").notNull().comment("When it takes effect.");
      t.string("decided_by", 64).nullable().comment("Who approved or rejected it.");
      t.timestamp("applied_at").nullable().comment("When it applied.");
      t.index(["group_key", "scope_id", "user_id"]);
      t.index(["status", "effective_at"]);
    });
  }
}
