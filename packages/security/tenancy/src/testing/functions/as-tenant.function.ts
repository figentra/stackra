/**
 * Stackra file contract:
 * Purpose: `asTenant(tenantId, work)`, runs `work` as `tenantId` through the real isolation on the current database:
 *          one transaction whose `app.tenant_id` (and `app.scope_*`) are set transaction-locally, exactly as the action
 *          pipeline and every background unit run, so a test proves row isolation instead of filling a column.
 * Boundary: test helper over `Database.current()` (a test's `usePostgres()` or the memory database) and the same
 *           `CallIsolationDriver` the pipeline binds; it needs a connected database, unlike `runAsTenant`, which has
 *           none. `undefined` runs `work` as a platform call (`app.tenant_id = ''`, which matches no tenant row; a staff
 *           user, so a scope option needs no tree). The driver gets a tree that shows each scope option as the tenant's own
 *           node (when its id is the tenant's) or a branch under it, so a scope option is known and never disagrees
 *           with the tenant given: the scope rules of `CallIsolationDriver` are proven in its own tests. It
 *           sets nothing about the database role: a test that proves a policy runs as a role without `BYPASSRLS` itself.
 * Runtime: node
 * Governing contract: ADR 0495 (decision 5); ADR 0269 (testing entries); ADR 0239; ADR 0182 (integration tier).
 */
import { ActorKind, Realm } from "@stackra/contracts";
import type { Actor, PublicId, ScopeRef } from "@stackra/contracts";
import { Database } from "@stackra/database";
import { MemoryScopeTreeDriver } from "@stackra/scope";

import { TenancyScopes } from "#core/enums/tenancy-scopes.enum";
import { CallIsolationDriver } from "#node/drivers/call-isolation.driver";
import { TenantIsolationService } from "#node/services/tenant-isolation.service";
import { tenantActor } from "#testing/functions/tenant-actor.function";

/** A staff user acting in no tenant: a platform call that, unlike a system actor, needs no tree to hold a scope. */
const PLATFORM: Actor = {
  kind: ActorKind.User,
  id: "usr_00000000000000000000000000",
  realm: Realm.Staff,
};

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
  return new CallIsolationDriver(
    database,
    new TenantIsolationService(database),
    treeOf(tenantId, options.scope),
  ).run(tenantId === undefined ? PLATFORM : tenantActor(tenantId), options.scope, work, {
    readOnly: options.readOnly ?? false,
  });
}

/**
 * The tree `asTenant` checks a scope option against: the helper proves row isolation, so each scope is shown as the
 * tenant's own node (its id is the tenant's) or as a branch under it, and never names a tenant of its own. A branch
 * with no tenant node among the options sits under a tenant node at its parent path.
 */
function treeOf(
  tenantId: PublicId<"scp"> | undefined,
  scope: ScopeRef | readonly ScopeRef[] | undefined,
): MemoryScopeTreeDriver {
  const scopes = scope === undefined ? [] : "path" in scope ? [scope] : scope;
  const [first] = scopes;
  // a platform call keeps no tenant, so it needs no tree
  if (tenantId === undefined || first === undefined) return new MemoryScopeTreeDriver();
  const own = scopes.find((one) => one.id === tenantId) ?? {
    id: tenantId,
    path: first.path.split(".").slice(0, -1).join("."),
  };
  return new MemoryScopeTreeDriver().seed([
    { ...own, level: TenancyScopes.Tenant, name: own.path },
    ...scopes
      .filter((one) => one.id !== tenantId)
      .map((one) => ({ ...one, level: "branch", name: one.path })),
  ]);
}
