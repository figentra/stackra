/**
 * Stackra file contract:
 * Purpose: the first table of the scope package, `scope.scope_nodes`, with the `ltree` extension, the path's GiST
 *          index and unique index, and the generated ancestor policy.
 * Boundary: a frozen snapshot of `scope.scope_node`, never edited once on main: it imports only @stackra/database and
 *           every name is a literal. The node's `id` is its scope id (`scp_…`), so the table carries no `scope_id` of
 *           its own. `level` is text with no check constraint, so a level added as data needs no migration. Row-level
 *           security matches `scope_path` at or below the session's `app.scope_paths` (`Database.withScope`), so a
 *           session sees only the nodes of its granted subtrees and writes only inside them. No `down()`: gen derives
 *           the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0327 (decisions 2, 3 and 9); ADR 0240 (decision 5); ADR 0159 (as amended); ADR 0160
 *                     (approved extensions); `.agents/rules/tenancy.md` (point 3).
 */
import { type Blueprint, Extension, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the node table. */
export class CreateScopeNodesMigration extends Migration {
  /** The extension, then the table with its indexes and policy. */
  up(schema: SchemaBuilder): void {
    schema.createExtension(Extension.Ltree);
    schema.create("scope_nodes", (t: Blueprint) => {
      t.hasPublicId("scp");
      t.timestamps();
      t.string("level", 63).notNull().comment("The key of the level the node sits at.");
      t.scopePath().notNull().comment("The node's materialised path, root first.");
      t.string("name", 200).notNull().comment("The node's display name.");
      t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
    });
    // shortcut: raw, because t.unique(["scope_path"]) would take the name t.scopePath() gives its GiST index
    // (idx_scope_nodes_scope_path); use t.unique once @stackra/database names the two apart.
    schema.sql(
      'create unique index "idx_scope_nodes_scope_path_key" on "scope"."scope_nodes" ("scope_path")',
      { inverse: 'drop index if exists "scope"."idx_scope_nodes_scope_path_key"' },
    );
  }
}
