/**
 * Stackra file contract:
 * Purpose: the fourth migration of the collaboration package (`collaboration.0004_contract_collaboration_tenancy`): the
 *          contract step of the expand step `collaboration.0003_add_collaboration_tenancy`. `comment_threads`,
 *          `comments`, `comment_revisions` and `comment_mentions` make `tenant_id` NOT NULL, take the tenant equality
 *          `pol_<table>_tenant_id` as their one permissive policy, and keep the scope path as a restrictive narrowing.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. It first refuses, before any change, while a row of these tables has a null `tenant_id`, naming
 *           each table's count: such an environment runs the backfill first. `belongsToTenant({ contract: true })`
 *           (@stackra/tenancy) sets NOT NULL and writes the equality policy; the scope-path policy each table was
 *           created with is dropped and written again as restrictive. No `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0239 (decision 1; 2026-11-07 amendment, item 1); ADR 0347 (decisions 1 to 3); ADR 0159 (as
 *                     amended: expand and contract).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** The scope-path policy each table was created with, now a restrictive narrowing. */
const SCOPE_PATHS = { setting: "app.scope_paths", match: "ancestor" } as const;

/** What an environment refused by the pre-flight runs first. */
const REMEDY =
  "Backfill tenant_id in this environment first (the RUNWAY 4c backfill, run per environment), then migrate again.";

/** Makes the tenant the owner of the collaboration tables. */
export class ContractCollaborationTenancyMigration extends Migration {
  /** The pre-flight, then per table: NOT NULL, the tenant equality and the scope path restrictive. */
  up(schema: SchemaBuilder): void {
    schema.refuseNulls(
      "tenant_id",
      ["comment_threads", "comments", "comment_revisions", "comment_mentions"],
      REMEDY,
    );
    schema.table("comment_threads", (t: Blueprint) => {
      t.dropRowLevelSecurity("scope_path", SCOPE_PATHS);
      t.belongsToTenant({ contract: true });
      t.rowLevelSecurity("scope_path", { ...SCOPE_PATHS, restrictive: true });
    });
    schema.table("comments", (t: Blueprint) => {
      t.dropRowLevelSecurity("scope_path", SCOPE_PATHS);
      t.belongsToTenant({ contract: true });
      t.rowLevelSecurity("scope_path", { ...SCOPE_PATHS, restrictive: true });
    });
    schema.table("comment_revisions", (t: Blueprint) => {
      t.dropRowLevelSecurity("scope_path", SCOPE_PATHS);
      t.belongsToTenant({ contract: true });
      t.rowLevelSecurity("scope_path", { ...SCOPE_PATHS, restrictive: true });
    });
    schema.table("comment_mentions", (t: Blueprint) => {
      t.dropRowLevelSecurity("scope_path", SCOPE_PATHS);
      t.belongsToTenant({ contract: true });
      t.rowLevelSecurity("scope_path", { ...SCOPE_PATHS, restrictive: true });
    });
  }
}
