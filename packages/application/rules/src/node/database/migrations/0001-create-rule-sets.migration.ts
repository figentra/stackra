/**
 * Stackra file contract:
 * Purpose: the first table of the rules package: `rules.rule_sets`, with the `ltree` extension and its generated
 *          scope policy.
 * Boundary: a frozen snapshot of `rules.rule_set`, never edited once on main: it imports only @stackra/database and
 *           every name is a literal. The conditions are revisions in `content.revisions`, @stackra/content's table.
 *           `consumer` is text with no check constraint: consumers are code, checked before a row is written.
 *           Row-level security matches `scope_path` at or below the session's `app.scope_paths`
 *           (`Database.withScope`), so a session reads and writes only inside its granted subtrees. No `down()`: gen
 *           derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0331 (decision 5); ADR 0327 (decisions 3 and 9); ADR 0159 (as amended); ADR 0160 (approved
 *                     extensions); `.agents/rules/tenancy.md` (point 3).
 */
import { type Blueprint, Extension, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the rule set table. */
export class CreateRuleSetsMigration extends Migration {
  /** The extension, then the table with its policy. */
  up(schema: SchemaBuilder): void {
    schema.createExtension(Extension.Ltree);
    schema.create("rule_sets", (t: Blueprint) => {
      t.hasPublicId("rset");
      t.timestamps();
      t.scopeId().notNull().comment("The scope node the rule set belongs to.");
      t.scopePath().notNull().comment("That node's path, denormalised for row-level security.");
      t.string("consumer", 127)
        .notNull()
        .comment("The key of the consumer whose fields its conditions test.");
      t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
    });
  }
}
