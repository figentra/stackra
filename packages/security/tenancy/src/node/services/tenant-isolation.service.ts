/**
 * Stackra file contract:
 * Purpose: `TenantIsolationService`, the application layer of tenant isolation: `withTenant(actor, work)` runs `work`
 *          in a transaction whose `app.tenant_id` is the verified caller's tenant, which every tenant-owned table's
 *          generated policy compares with, and makes that tenant the one new `BelongsToTenant` rows take.
 * Boundary: a platform service over the `Database` port. The tenant comes from the `Actor` the pipeline built from the
 *           verified credential (ADR 0098), never from a body, a query or a client header. A caller with no tenant (a
 *           platform call) runs with `''`, which matches no tenant row, so cross-tenant reads exist only in an audited
 *           endpoint an ADR names (rule `tenancy`, point 5). It composes with `Database.withScope` (the scope settings)
 *           and sets nothing else; inside a running transaction the setting lasts until it ends.
 * Runtime: node
 * Governing contract: ADR 0239 (decision 1); ADR 0210 (decisions 3 and 7: one context, `withTenant`); ADR 0327
 *                     (decisions 8 and 9: isolation in the database); ADR 0160 (raw SQL in a service method);
 *                     `.agents/rules/tenancy.md` (point 1).
 */
import { Service } from "@stackra/container";
import type { Actor } from "@stackra/contracts";
import type { Database } from "@stackra/database";

import { isTenantId } from "#core/index";
import { ACTIVE_TENANT } from "#node/constants/active-tenant.constant";
import { TENANT_ID_SETTING } from "#node/constants/tenant-id-setting.constant";

/**
 * Runs work as one tenant.
 *
 * @example
 * await database.withScope(scope, () =>
 *   tenancy.withTenant(actor, () => pipeline.execute(type, input, { actor })),
 * );
 */
export class TenantIsolationService extends Service {
  /** The service's database. */
  private readonly database: Database;

  /**
   * @param database - the connected database.
   */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /**
   * Runs `work` in a transaction (a savepoint inside one) with `app.tenant_id` set to `actor.scopeId`, `''` when the
   * actor acts in no tenant.
   *
   * @throws TypeError when `actor.scopeId` is set but is not a tenant id (`scp_…`), a wiring error.
   */
  withTenant<T>(actor: Actor, work: () => Promise<T>): Promise<T> {
    const { scopeId: tenantId } = actor;
    if (tenantId !== undefined && !isTenantId(tenantId))
      throw new TypeError(`"${tenantId}" is not a tenant id: the public id of a scope node`);
    return this.database.transaction(async () => {
      // raw-sql: set_config is how a transaction carries the tenant the generated equality policies compare with
      await this.database
        .em()
        .execute("select set_config(?, ?, true)", [TENANT_ID_SETTING, tenantId ?? ""]);
      return ACTIVE_TENANT.run(tenantId, work);
    });
  }
}
