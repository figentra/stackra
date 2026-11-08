/**
 * Stackra file contract:
 * Purpose: `MemoryCallIsolationDriver`, the `CallIsolation` a test takes with `.useDrivers("memory")`: it runs the work
 *          as the actor's tenant (`ACTIVE_TENANT`, which `BelongsToTenant` reads), so a row a call builds carries the
 *          tenant before it is flushed, as under `CallIsolationDriver`. A call with a scope runs in its scope session
 *          (`Database.withScope`) when a database is connected, as a background unit did with no isolation bound, so
 *          its writes keep their scope columns.
 * Boundary: test only, offered by the tenancy testing plugin and declared `internal`, so gen never lists it as a
 *           candidate and a production wiring never sees it. No `app.tenant_id` and no scope tree: the tenant is the
 *           actor's own (`actingScopeId`). An actor with none is a platform call and runs as it is, whatever tenant
 *           the test runs in. Like the real driver it refuses a call of another tenant inside a running one
 *           (`TenantSwitchRefusedError`): a `runAsTenant` or an outer call. Not read-only for a query.
 * Runtime: node
 * Governing contract: ADR 0495 (decisions 1 and 2); ADR 0266 (memory first); ADR 0269 (decision 3); ADR 0239.
 */
import { CallIsolation } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";
import { actingScopeId } from "@stackra/contracts";
import type { Actor, PublicId, ScopeRef } from "@stackra/contracts";
import { Database } from "@stackra/database";

import { TenantSwitchRefusedError } from "#core/errors/tenant-switch-refused.error";
import { ACTIVE_TENANT } from "#node/constants/active-tenant.constant";

/**
 * Runs work as the actor's tenant, in memory.
 *
 * @example
 * await new MemoryCallIsolationDriver().run(actor, undefined, async () => new Member().tenantId, { readOnly: false });
 */
export class MemoryCallIsolationDriver extends Driver(CallIsolation, { internal: true }) {
  /**
   * Implements `CallIsolation.run`, documented there; `work` receives `actor` unchanged.
   *
   * @throws TenantSwitchRefusedError when the test already runs as another tenant than the actor's.
   */
  async run<T>(
    actor: Actor,
    scope: ScopeRef | readonly ScopeRef[] | undefined,
    work: (actor?: Actor) => Promise<T>,
  ): Promise<T> {
    const tenant = actingScopeId(actor) as PublicId<"scp"> | undefined;
    const held = ACTIVE_TENANT.getStore();
    if (tenant !== undefined && held !== undefined && held !== tenant)
      throw TenantSwitchRefusedError.create();
    const inTenant = () =>
      tenant === undefined ? work(actor) : ACTIVE_TENANT.run(tenant, () => work(actor));
    const scopes = scope === undefined ? [] : "path" in scope ? [scope] : scope;
    const database = scopes.length === 0 ? undefined : connected();
    // shortcut: no transaction for a call without a scope (production opens one); open it if a test needs the rollback
    return database === undefined ? inTenant() : database.withScope(scopes, inTenant);
  }
}

/** The connected database, or none in a test that runs without one. */
function connected(): Database | undefined {
  try {
    return Database.current();
  } catch {
    return undefined;
  }
}
