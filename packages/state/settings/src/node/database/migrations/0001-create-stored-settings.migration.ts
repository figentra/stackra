/**
 * Stackra file contract:
 * Purpose: the first table of the settings package, `settings.stored_settings`: one row per group and holder (a scope
 *          node or a user), with the `ltree` extension, the path's GiST index and one unique index per holder kind.
 * Boundary: a frozen snapshot of `settings.stored_setting`, never edited once on main: it imports only
 *           @stackra/database and every name is a literal. No row-level-security policy: the cascade reads the rows
 *           above a node (`scope_path @> path`), which the generated subtree policy would hide, so reads stay on the
 *           node's ancestor chain in `StoredSettingService` and writes name their holder (an open item for the owner).
 *           Postgres treats nulls as distinct, so each unique index binds only its own holder kind. No `down()`: gen
 *           derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0213 (decisions 1 and 2); ADR 0327 (decisions 3 and 9); ADR 0159 (as amended); ADR 0160
 *                     (approved extensions).
 */
import { type Blueprint, Extension, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the stored settings table. */
export class CreateStoredSettingsMigration extends Migration {
  /** The extension, then the table with its indexes. */
  up(schema: SchemaBuilder): void {
    schema.createExtension(Extension.Ltree);
    schema.create("stored_settings", (t: Blueprint) => {
      t.hasPublicId("sst");
      t.timestamps();
      t.string("group_key", 63).notNull().comment("The settings group, which is the module key.");
      t.scopeId().nullable().comment("The node of a node row; null on a user row.");
      t.scopePath().nullable().comment("That node's path, denormalised for the ancestor read.");
      t.string("user_id", 33).nullable().comment("The user of a user row; null on a node row.");
      t.jsonb("values").notNull().default({}).comment("The holder's values by path in the group.");
      t.jsonb("locked")
        .notNull()
        .default([])
        .comment("The paths the holder locks for every holder below it.");
      t.unique(["group_key", "scope_id"]);
      t.unique(["group_key", "user_id"]);
    });
  }
}
