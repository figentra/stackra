/**
 * Stackra file contract:
 * Purpose: the ninth migration of the search package (`search.0009_contract_search_tenancy`): the contract step of
 *          `search.0008_add_search_tenancy` in the platform form (ADR 0239 amendment, item 6 and gap C). `vector_items`
 *          and `queries` keep `tenant_id` nullable, a NULL row being the platform's (the global corpus at the root, a
 *          product's at its node), and take one permissive policy `pol_<table>_tenant_id`: a tenant session reads its
 *          rows and the NULL rows and writes only its own, a platform session reads and writes only NULL rows. The
 *          restrictive `pol_<table>_tenant_id_write_update` and `_write_delete` keep a tenant off the platform's rows.
 *          The scope path stays a restrictive narrowing: a tenant row at or below a granted path, a NULL row at or
 *          above one, so a tenant reads the root's and its product's corpus and never another product's.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. It first refuses, before any change, while a row has a null `tenant_id` deeper than a product
 *           node (`nlevel(scope_path) > 2`): that is a tenant's row the expand step left unfilled, not a platform row,
 *           and the backfill runs first. A NULL row at the root or a product node is a platform row and stays. No
 *           `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0239 (2026-11-07 amendment, items 6 and 8, gap C); ADR 0347 (decisions 1 to 3); ADR 0159
 *                     (as amended: expand and contract).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** The scope-path policy each table was created with, now a restrictive narrowing of the tenant rows. */
const SCOPE_PATHS = { setting: "app.scope_paths", match: "ancestor" } as const;

/** What an environment refused by the pre-flight runs first. */
const REMEDY =
  "Backfill tenant_id in this environment first (the RUNWAY 4c backfill, run per environment), then migrate again.";

/** Makes the search tables tenant-owned in the platform form. */
export class ContractSearchTenancyMigration extends Migration {
  /** The pre-flight over the tenant rows, then per table: the platform policy and the scope path restrictive. */
  up(schema: SchemaBuilder): void {
    // A platform row sits at the root or a product node; a row deeper carries a tenant's path, so a null there is a
    // missed backfill.
    schema.refuseNulls("tenant_id", ["vector_items", "queries"], REMEDY, {
      where: 'nlevel("scope_path") > 2',
    });
    schema.table("vector_items", (t: Blueprint) => {
      t.dropRowLevelSecurity("scope_path", SCOPE_PATHS);
      t.belongsToTenant({ contract: true, nullable: true });
      t.rowLevelSecurity("scope_path", {
        ...SCOPE_PATHS,
        restrictive: true,
        exemptNull: "tenant_id",
      });
    });
    schema.table("queries", (t: Blueprint) => {
      t.dropRowLevelSecurity("scope_path", SCOPE_PATHS);
      t.belongsToTenant({ contract: true, nullable: true });
      t.rowLevelSecurity("scope_path", {
        ...SCOPE_PATHS,
        restrictive: true,
        exemptNull: "tenant_id",
      });
    });
  }
}
