/**
 * Stackra file contract:
 * Purpose: the first migration of the database package (`database.0001_create_sequence_tables`): the tables behind
 *          `Sequence` and `SequenceService`. `sequence_counters` holds one row per sequence, scope node, series and
 *          period, locked for the transaction that takes a number; `sequence_blocks` holds the blocks reserved for
 *          offline issue and the returned remainders waiting to be handed out again; `sequence_voids` holds the
 *          numbers that will never be a document, each range with its reason and its block.
 * Boundary: a frozen snapshot, never edited once on main: it imports only this package's own migration API and every
 *           name is a literal. It lives in the package's own schema (`database`), which gen creates first. Every table
 *           carries the scope columns and the forced ancestor policy on `app.scope_paths`, so a session sees and writes
 *           only the counters of its granted scopes. No Postgres `SEQUENCE`: a rolled-back transaction would burn its
 *           value. No column holds personal data: `holder` is a device's public id. No `down()`: gen derives the dev
 *           inverse.
 * Runtime: node
 * Governing contract: ADR 0342 (decisions 2 to 5); ADR 0159 (as amended); ADR 0160 (approved extensions); ADR 0327
 *                     (decisions 3 and 9); `.agents/rules/tenancy.md` (point 3).
 */
import { Extension, Migration, type Blueprint, type SchemaBuilder } from "@stackra/database";

/** Creates the counter, block and void tables. */
export class CreateSequenceTablesMigration extends Migration {
  /** The extension, then the three tables, each with its scope columns and policy. */
  up(schema: SchemaBuilder): void {
    schema.createExtension(Extension.Ltree);
    schema.create("sequence_counters", (t: Blueprint) => {
      t.timestamps();
      t.string("sequence_key", 127).notNull().comment("The sequence's locked key, <module>.<key>.");
      t.scopeId().notNull().comment("The scope node the series counts in.");
      t.scopePath().notNull().comment("That node's path, denormalised for the policy.");
      t.string("series", 500)
        .notNull()
        .comment("The values of the declared series dimensions, a JSON array in declared order.");
      t.integer("period")
        .notNull()
        .comment("The year of a yearly sequence; 0 for one that never resets.");
      t.integer("last_number")
        .notNull()
        .default(0)
        .comment("The last number handed out, to a document or to a reserved block.");
      t.primary(["sequence_key", "scope_id", "series", "period"]);
      t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
    });
    schema.create("sequence_blocks", (t: Blueprint) => {
      t.hasPublicId("sqb");
      t.timestamps();
      t.string("sequence_key", 127).notNull().comment("The sequence's locked key, <module>.<key>.");
      t.scopeId().notNull().comment("The scope node the series counts in.");
      t.scopePath().notNull().comment("That node's path, denormalised for the policy.");
      t.string("series", 500)
        .notNull()
        .comment("The values of the declared series dimensions, a JSON array in declared order.");
      t.integer("period")
        .notNull()
        .comment("The year of a yearly sequence; 0 for one that never resets.");
      t.string("holder", 63)
        .nullable()
        .comment(
          "The device holding the block; null on a returned remainder waiting to be handed out.",
        );
      t.integer("first_number").notNull().comment("The first number of the block.");
      t.integer("last_number").notNull().comment("The last number of the block.");
      t.integer("issued_through")
        .notNull()
        .comment("The last number accepted from the block; first_number - 1 before any.");
      t.timestamp("released_at")
        .nullable()
        .comment("When the block was released or voided; null while it is held.");
      t.index(["sequence_key", "scope_id", "series", "period"]).where("holder is null");
      t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
    });
    schema.create("sequence_voids", (t: Blueprint) => {
      t.timestamps();
      t.string("sequence_key", 127).notNull().comment("The sequence's locked key, <module>.<key>.");
      t.scopeId().notNull().comment("The scope node the series counts in.");
      t.scopePath().notNull().comment("That node's path, denormalised for the policy.");
      t.string("series", 500)
        .notNull()
        .comment("The values of the declared series dimensions, a JSON array in declared order.");
      t.integer("period")
        .notNull()
        .comment("The year of a yearly sequence; 0 for one that never resets.");
      t.integer("first_number").notNull().comment("The first voided number.");
      t.integer("last_number").notNull().comment("The last voided number.");
      t.string("reason", 500)
        .notNull()
        .comment("Why the numbers will never be documents, for the audit; never personal data.");
      t.belongsTo("sequence_blocks", { column: "block_id" })
        .notNull()
        .comment("The reserved block the numbers came from.");
      t.primary(["sequence_key", "scope_id", "series", "period", "first_number"]);
      t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
    });
  }
}
