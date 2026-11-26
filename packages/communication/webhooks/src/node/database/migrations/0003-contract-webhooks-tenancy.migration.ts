/**
 * Stackra file contract:
 * Purpose: the third migration of the webhooks package (`webhooks.0003_contract_webhooks_tenancy`): makes
 *          `webhook_endpoints` and `webhook_deliveries` tenant-owned in one step. Each gets `tenant_id` the way a table
 *          born tenant-owned has it (NOT NULL, filled from `app.tenant_id` by default, indexed) and the tenant equality
 *          `pol_<table>_tenant_id` as its one permissive policy. Until now neither table had a policy: the scope was
 *          data (`scope_id`, `scope_path`) the endpoint service filtered on, with no sentinel row.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. Everything but the two indexes runs in one transaction: the nullable column, the backfill, the
 *           pre-flight, then NOT NULL and the policy. The backfill reads only what these tables hold: an endpoint whose
 *           scope node sits right under a product (`nlevel(scope_path) = 3`, the tenant level a deployment appends
 *           after `product`) is that tenant's own node, so its `scope_id` is its tenant; a delivery takes its
 *           endpoint's tenant. Any other row (an endpoint at the root, at a product, or below a tenant, where a branch
 *           and a child tenant look alike without the scope tree) keeps a null tenant, and the pre-flight refuses the
 *           whole transaction, naming each table's count, so a refusal changes nothing. No unique key here is per
 *           tenant (the ids are global public ids; `event_id`'s index is not unique). No `down()`: gen derives the
 *           dev inverse.
 * Runtime: node
 * Governing contract: ADR 0239 (decision 1; 2026-11-07 amendment, group (c)); ADR 0347 (decisions 1 and 2); ADR 0327
 *                     (decisions 2 and 8: the tenant level); ADR 0159 (as amended: expand and contract).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** What an environment refused by the pre-flight does first. */
const REMEDY =
  "An endpoint above or below a top-level tenant node has no tenant this migration can read: delete it (its deliveries go with it) or set its scope to its tenant's node, then migrate again.";

/** Makes the tenant the owner of the endpoints and their delivery log. */
export class ContractWebhooksTenancyMigration extends Migration {
  /** The column, the backfill, the pre-flight, then per table: NOT NULL and the tenant equality. */
  up(schema: SchemaBuilder): void {
    schema.table("webhook_endpoints", (t: Blueprint) => {
      t.belongsToTenant({ expand: true });
    });
    schema.table("webhook_deliveries", (t: Blueprint) => {
      t.belongsToTenant({ expand: true });
    });
    schema.sql(
      `update "webhooks"."webhook_endpoints" set "tenant_id" = "scope_id" where "tenant_id" is null and nlevel("scope_path") = 3`,
      { inverse: false },
    );
    schema.sql(
      `update "webhooks"."webhook_deliveries" d set "tenant_id" = e."tenant_id" from "webhooks"."webhook_endpoints" e where d."endpoint_id" = e."id" and d."tenant_id" is null`,
      { inverse: false },
    );
    schema.refuseNulls("tenant_id", ["webhook_endpoints", "webhook_deliveries"], REMEDY);
    schema.table("webhook_endpoints", (t: Blueprint) => {
      t.belongsToTenant({ contract: true });
    });
    schema.table("webhook_deliveries", (t: Blueprint) => {
      t.belongsToTenant({ contract: true });
    });
  }
}
