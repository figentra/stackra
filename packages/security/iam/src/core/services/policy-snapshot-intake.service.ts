/**
 * Stackra file contract:
 * Purpose: `PolicySnapshotIntakeService`, the snapshot listener every consuming service mounts: it decodes the IAM
 *          service's snapshot event and keeps it in the bound `PolicySnapshotStore` under the event's tenant.
 * Boundary: the body of the listener, not the listener kind: @stackra/iam does not depend on @stackra/events, so the
 *           consumer's one-line `Listener` on the IAM event calls `handle({ ...event, scopeId: meta.scopeId })`.
 *           The payload is untrusted: a missing principal or a malformed snapshot throws a `TypeError` (the delivery
 *           then retries and dead-letters; nothing is stored), and the store keeps only a higher version, so redelivery
 *           is harmless.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decisions 1 to 4); ADR 0141; ADR 0407; STA-815.
 */
import { Service } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";

import { PolicySnapshotStore } from "#contracts/index";
import { decodePolicySnapshot } from "#core/functions/decode-policy-snapshot.function";
import type { PolicySnapshotEvent } from "#core/types/policy-snapshot-event.type";

/**
 * Stores the snapshots the IAM service publishes.
 *
 * @example
 * export class PolicySnapshotListener extends Listener({ on: PolicySnapshotUpdated }) {
 *   handle(event: PolicySnapshotUpdated, ctx: ListenerContext) {
 *     return this.intake.handle({ ...event, scopeId: ctx.meta.scopeId });
 *   }
 * }
 */
export class PolicySnapshotIntakeService extends Service {
  /** Where the snapshots are kept. */
  private readonly store: PolicySnapshotStore;

  /** @param store - the service's tenant-scoped snapshot store. */
  constructor(store: PolicySnapshotStore) {
    super();
    this.store = store;
  }

  /**
   * Decodes `event` and keeps its snapshot; `true` when it was newer than the one held.
   *
   * @throws TypeError when the event names no principal or carries no policy snapshot.
   * @throws Error when the store cannot be reached.
   */
  async handle(event: PolicySnapshotEvent): Promise<boolean> {
    if (typeof event.principal !== "string" || event.principal === "")
      throw new TypeError("a policy snapshot event names no principal");
    return this.store.write(
      event.principal as PublicId,
      decodePolicySnapshot(event.snapshot),
      event.scopeId,
    );
  }
}
