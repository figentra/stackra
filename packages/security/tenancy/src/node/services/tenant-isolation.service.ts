/**
 * Stackra file contract:
 * Purpose: `TenantIsolationService`, the application layer of tenant isolation: `withTenant(actor, work)` runs `work`
 *          in a transaction whose `app.tenant_id` is the verified caller's tenant (an agent with none acts in its
 *          human's), which every tenant-owned table's
 *          generated policy compares with, and makes that tenant the one new `BelongsToTenant` rows take.
 * Boundary: a platform service over the `Database` port. The tenant comes from the `Actor` the pipeline built from the
 *           verified credential (ADR 0098), never from a body, a query or a client header. A caller with no tenant (a
 *           platform call) runs with `''`, which matches no tenant row, so cross-tenant reads exist only in an audited
 *           endpoint an ADR names (rule `tenancy`, point 5). It composes with `Database.withScope` (the scope settings)
 *           and sets nothing else; inside a running transaction it puts the enclosing tenant back when `work` ends,
 *           after flushing `work`'s writes, which belong to the inner tenant (as `Database.withScope` does).
 * Runtime: node
 * Governing contract: ADR 0239 (decision 1); ADR 0210 (decisions 3 and 7: one context, `withTenant`); ADR 0327
 *                     (decisions 8 and 9: isolation in the database); ADR 0160 (raw SQL in a service method);
 *                     `.agents/rules/tenancy.md` (point 1).
 */
import { Service } from "@stackra/container";
import { actingScopeId } from "@stackra/contracts";
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
   * The tenant the running transaction is set to: `''` when none is, or when it is not in a tenant.
   */
  async currentTenant(): Promise<string> {
    // raw-sql: the tenant setting is transaction state, which only SQL reads
    const [row] = (await this.database
      .em()
      .execute("select current_setting(?, true) as tenant", [TENANT_ID_SETTING])) as {
      tenant: string | null;
    }[];
    return row?.tenant ?? "";
  }

  /**
   * Runs `work` in a transaction (a savepoint inside one) with `app.tenant_id` set to the actor's tenant (`actingScopeId`:
   * its own `scopeId`, or for an agent or a service with none the tenant of the user it acts for), `''` when it acts in no tenant. Inside a running transaction the enclosing tenant is back once `work` ends: put back after
   * it returns (its writes flushed first), and by the savepoint's rollback when it throws.
   *
   * @throws TypeError when the actor's tenant is set but is not a tenant id (`scp_…`), a wiring error.
   */
  withTenant<T>(actor: Actor, work: () => Promise<T>): Promise<T> {
    const tenantId = actingScopeId(actor);
    if (tenantId !== undefined && !isTenantId(tenantId))
      throw new TypeError(`"${tenantId}" is not a tenant id: the public id of a scope node`);
    const nested = this.database.em().isInTransaction();
    return this.database.transaction(async () => {
      const enclosing = nested ? await this.currentTenant() : undefined;
      await this.setTenant(tenantId ?? "");
      const result = await ACTIVE_TENANT.run(tenantId, async () => {
        const value = await work();
        // the ORM flushes the savepoint after this returns, and its writes belong to the inner tenant
        if (enclosing !== undefined) await this.database.em().flush();
        return value;
      });
      // a released savepoint keeps a set_config(…, true) until the outer transaction ends, so put the outer one back
      if (enclosing !== undefined) await this.setTenant(enclosing);
      return result;
    });
  }

  /** Sets `app.tenant_id` for the rest of the running transaction. */
  private async setTenant(tenantId: string): Promise<void> {
    // raw-sql: set_config is how a transaction carries the tenant the generated equality policies compare with
    await this.database
      .em()
      .execute("select set_config(?, ?, true)", [TENANT_ID_SETTING, tenantId]);
  }
}
