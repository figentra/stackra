/**
 * Stackra file contract:
 * Purpose: `ServicePlanSnapshotsDriver`, the `PlanSnapshots` a service binds to read real plans: it asks the plan
 *          service through `PlanServiceChannel` (`@stackra/clients`' `TransportPlanServiceChannelDriver` calls
 *          `entitlements.effective_set.snapshot.get@1`) and caches each answer for the `maxAgeSeconds` it carries.
 * Boundary: fails closed. A failed call, an answer for another scope or an undecodable grant reads as no plan (every
 *           right refused) and is not cached, so the next read asks again. A scope whose plan service has no plan
 *           (version 0) and the platform-wide read (`undefined`) are no plan. The cache is per process.
 * Runtime: isomorphic
 * Governing contract: ADR 0215 (decisions 5 and 6); ADR 0263 (a driver is named by its class); ADR 0260 (decision 6).
 */
import { Driver } from "@stackra/container";
import type { Clock, PublicId } from "@stackra/contracts";
import { decodePlanGrants } from "#core/functions/decode-plan-grants.function";
import type { PlanServiceChannel } from "#contracts/ports/plan-service-channel.port";
import { PlanSnapshots } from "#contracts/ports/plan-snapshots.port";
import type { PlanSnapshot } from "#contracts/types/plan-snapshot.type";

/**
 * Plans from the plan service, cached briefly.
 *
 * @example
 * container.bind(PlanServiceChannel, TransportPlanServiceChannelDriver);
 * container.bind(PlanSnapshots, ServicePlanSnapshotsDriver);
 */
export class ServicePlanSnapshotsDriver extends Driver(PlanSnapshots) {
  /** Scope id to its answer and the time it lapses, in epoch milliseconds. */
  private readonly cache = new Map<PublicId, { snapshot?: PlanSnapshot; until: number }>();

  /**
   * @param channel - the plan service's `snapshot.get`, in the call's own scope.
   * @param clock - the time the cache lapses against.
   */
  constructor(
    private readonly channel: PlanServiceChannel,
    private readonly clock: Clock,
  ) {
    super();
  }

  /** The plan of `scope`, or `undefined` when it has none or it cannot be read. */
  async read(scope: PublicId | undefined): Promise<PlanSnapshot | undefined> {
    if (scope === undefined) return undefined;
    const now = this.clock.now().getTime();
    const cached = this.cache.get(scope);
    if (cached !== undefined && cached.until > now) return cached.snapshot;
    try {
      const view = await this.channel.snapshot();
      // the channel asks in the call's own scope; an answer for any other scope is never trusted
      if (view.scopeId !== scope) return undefined;
      const seats = decodePlanGrants(view.seats);
      const snapshot: PlanSnapshot | undefined =
        view.version === 0
          ? undefined
          : {
              version: view.version,
              grants: decodePlanGrants(view.grants),
              seats: Object.fromEntries(
                Object.entries(seats).filter(([, grant]) => typeof grant !== "boolean"),
              ) as PlanSnapshot["seats"],
              ...(view.paidSince === null ? {} : { paidSince: new Date(view.paidSince) }),
            };
      this.cache.set(scope, {
        ...(snapshot === undefined ? {} : { snapshot }),
        until: now + view.maxAgeSeconds * 1000,
      });
      return snapshot;
    } catch {
      // fail closed: no plan refuses every right, and nothing is cached so the next read asks again
      return undefined;
    }
  }
}
