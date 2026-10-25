/**
 * Stackra file contract:
 * Purpose: the revisions table of the `HasRevisions` trait: `content.revisions`, one row per revision of a record,
 *          with its unique index and its generated scope policy.
 * Boundary: a frozen snapshot of `content.revision`, never edited once on main: it imports only @stackra/database and
 *           every name is a literal. The `ltree` extension is the first migration's. Row-level security matches
 *           `scope_path` at or below the session's `app.scope_paths` (`Database.withScope`), so a session reads and
 *           writes only the revisions inside its granted subtrees. No `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0321 (decision 2); ADR 0116 (decision CT3); ADR 0327 (decisions 3 and 9); ADR 0159 (as
 *                     amended); `.agents/rules/tenancy.md` (point 3).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the revisions table. */
export class CreateRevisionsMigration extends Migration {
  /** The table with its unique index and policy. */
  up(schema: SchemaBuilder): void {
    schema.create("revisions", (t: Blueprint) => {
      t.hasPublicId("rev");
      t.timestamps();
      t.scopeId().notNull().comment("The scope node of the record.");
      t.scopePath().notNull().comment("That node's path, denormalised for row-level security.");
      t.string("model", 127).notNull().comment("The key of the record's model.");
      t.string("record_id", 33).notNull().comment("The record's public id.");
      t.integer("number").notNull().comment("The revision's number for its record, from 1.");
      t.jsonb("data")
        .notNull()
        .comment("The record's content at this revision; never changed once written.");
      t.timestamp("published_at")
        .nullable()
        .comment("When the revision was last published; null for a draft.");
      t.unique(["model", "record_id", "number"]);
      t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
    });
  }
}
