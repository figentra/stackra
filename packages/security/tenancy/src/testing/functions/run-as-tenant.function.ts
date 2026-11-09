/**
 * Stackra file contract:
 * Purpose: `runAsTenant(tenantId, work)`, runs `work` as `tenantId` without a database, so a model factory or
 *          `new Model()` fills `BelongsToTenant` (and `BelongsToTenantOrPlatform`) with that tenant in a unit test.
 *          When a database is connected, a new `BelongsToTenant` row flushed inside `work` whose `tenantId` is not
 *          `tenantId` refuses the flush (`RunAsTenantSubscriber`): a factory `definition()` that sets `tenantId`
 *          would otherwise silently put the row in another tenant.
 * Boundary: test helper over the internal tenant storage, the application half of `withTenant` only: no transaction
 *           and no `app.tenant_id`, so it proves nothing about row isolation (an isolation test calls `asTenant`, which runs the real isolation on a
 *           database, ADR 0495). `undefined` runs `work` as a platform call. It registers the check on the event
 *           manager of the connected database's running context, once each; with none connected (or a stand-in
 *           entity manager with no events) it only fills the trait.
 * Runtime: node
 * Governing contract: ADR 0269 (testing entries); ADR 0239; OS audit SPEC gap 11.
 */
import type { PublicId } from "@stackra/contracts";
import { Database } from "@stackra/database";

import { ACTIVE_TENANT } from "#node/constants/active-tenant.constant";
import { RUN_AS_TENANT_CALL } from "#testing/constants/run-as-tenant-call.constant";
import { RunAsTenantSubscriber } from "#testing/orm/run-as-tenant.subscriber";

/** The part of the ORM's event manager the check needs. */
interface Events {
  readonly registerSubscriber: (subscriber: RunAsTenantSubscriber) => void;
}

/** The event managers the check is registered on. */
const WATCHED = new WeakSet<Events>();

/**
 * Runs `work` in `tenantId`'s tenant call.
 *
 * @throws Error from a flush inside `work` of a `BelongsToTenant` row whose `tenantId` is not `tenantId`.
 * @example
 * const order = runAsTenant(tenantId, () => new Order()); // order.tenantId === tenantId
 */
export function runAsTenant<T>(tenantId: PublicId<"scp"> | undefined, work: () => T): T {
  watchFlushes();
  return RUN_AS_TENANT_CALL.run(tenantId, () => ACTIVE_TENANT.run(tenantId, work));
}

/** Registers `RunAsTenantSubscriber` on the connected database's running event manager, once per manager. */
// shortcut: a database connected inside `work` (a module compiled there) is not watched; register later if one is
function watchFlushes(): void {
  let events: Events | undefined;
  try {
    // reason: a unit test's stand-in database may hand out an entity manager with no event manager
    events = (Database.current().em() as { getEventManager?: () => Events }).getEventManager?.();
  } catch {
    // no database connected: there is no flush to check, runAsTenant only fills the trait
    return;
  }
  if (events === undefined || WATCHED.has(events)) return;
  WATCHED.add(events);
  events.registerSubscriber(new RunAsTenantSubscriber());
}
