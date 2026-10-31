/**
 * Stackra file contract:
 * Purpose: `asTenant(tenantId, work)`, runs `work` as `tenantId` through the real isolation on the current database:
 *          one transaction whose `app.tenant_id` (and `app.scope_*`) are set transaction-locally, exactly as the action
 *          pipeline and every background unit run, so a test proves row isolation instead of filling a column.
 * Boundary: test helper over `Database.current()` (a test's `usePostgres()` or the memory database) and the same
 *           `CallIsolationDriver` the pipeline binds; it needs a connected database, unlike `runAsTenant`, which has
 *           none. `undefined` runs `work` as a platform call (`app.tenant_id = ''`, which matches no tenant row). It
 *           sets nothing about the database role: a test that proves a policy runs as a role without `BYPASSRLS` itself.
 * Runtime: node
 * Governing contract: ADR 0495 (decision 5); ADR 0269 (testing entries); ADR 0239; ADR 0182 (integration tier).
 */
import { ActorKind } from "@stackra/contracts";
import type { Actor, PublicId, ScopeRef } from "@stackra/contracts";
import { Database } from "@stackra/database";

import { CallIsolationDriver } from "#node/drivers/call-isolation.driver";
import { TenantIsolationService } from "#node/services/tenant-isolation.service";
import { tenantActor } from "#testing/functions/tenant-actor.function";

/** A caller acting in no tenant. */
const PLATFORM: Actor = { kind: ActorKind.System, id: "sys_00000000000000000000000000" };

/**
 * Runs `work` in `tenantId`'s isolation on the current database; `options.scope` sets the scope settings (none by
 * default: no granted path) and `options.readOnly` starts the transaction read-only, as a query does.
 *
 * @throws Error when no database is connected.
 * @example
 * const orders = await asTenant(tenantId, () => repository.find({}));
 */
export function asTenant<T>(
  tenantId: PublicId<"scp"> | undefined,
  work: () => Promise<T>,
  options: {
    readonly scope?: ScopeRef | readonly ScopeRef[];
    readonly readOnly?: boolean;
  } = {},
): Promise<T> {
  const database = Database.current();
  return new CallIsolationDriver(database, new TenantIsolationService(database)).run(
    tenantId === undefined ? PLATFORM : tenantActor(tenantId),
    options.scope,
    work,
    { readOnly: options.readOnly ?? false },
  );
}
