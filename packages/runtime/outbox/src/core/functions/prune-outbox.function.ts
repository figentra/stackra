/**
 * Stackra file contract:
 * Purpose: `pruneOutbox(outbox, inbox, days, now, isolation)`, the outbox's retention: deletes dead-lettered messages
 *          and received event ids of the inbox older than `days` before `now`, with one cutoff for both, and answers how
 *          many dead letters went.
 * Boundary: works through the `OutboxDriver`, `InboxDriver` and `CallIsolation` ports only. The dead letters of every
 *           tenant are claimed (ids and tenants) and each is deleted in its own tenant's isolation (`inRowOwner`),
 *           since no session with no tenant may delete a tenant's row (ADR 0239 amendment, gap A); a claimed one still
 *           there after its delete is refused (`ClaimNotLoadedError`), so the loop never spins. Live messages are never
 *           pruned: a delivered one is already deleted, a due one waits. The change log has its own retention
 *           (`maintainChangeLog`). The daily prune job of @stackra/data-maintenance calls it with
 *           `outbox.pruneAfterDays`; this package declares no job.
 * Runtime: isomorphic
 * Governing contract: data-layer gap gov6 (the outbox prune); ADR 0078 (decision 4); ADR 0189 (decision 4: data is
 *                     kept no longer than needed); ADR 0462 (decision 1: jobs live in an add-on above iam); ADR 0239
 *                     (2026-11-07 amendment, gaps A and C).
 */
import { ClaimNotLoadedError, inRowOwner } from "@stackra/actions";
import type { CallIsolation } from "@stackra/actions/contracts";

import type { InboxDriver, OutboxDriver } from "#contracts/index";
import { OUTBOX_ACTOR_ID } from "#core/constants/outbox-actor-id.constant";

/** One day in milliseconds. */
const DAY = 86_400_000;

/** Dead letters one claim takes. */
const BATCH = 500;

/**
 * Prunes old dead letters and inbox ids.
 *
 * @example
 * const { dead } = await pruneOutbox(outbox, inbox, 30, new Date(), isolation);
 * @throws ClaimNotLoadedError when a claimed dead letter was not deleted in its tenant.
 * @throws RowIsolationMissingError when a tenant's dead letter is claimed and no isolation is bound.
 */
export async function pruneOutbox(
  outbox: OutboxDriver,
  inbox: InboxDriver,
  days: number,
  now: Date,
  isolation?: CallIsolation,
): Promise<{ readonly dead: number }> {
  const cutoff = new Date(now.getTime() - days * DAY);
  // shortcut: dead cross-app deliveries (outbox.deliveries) are not pruned yet; add DeliveryDriver.claimDead and a
  // driver argument here (with @stackra/data-maintenance's job) before a producer's dead letters grow large
  const removed = new Set<string>();
  for (;;) {
    const claims = await outbox.claimDead(cutoff, BATCH);
    for (const claim of claims) {
      if (removed.has(claim.id)) throw ClaimNotLoadedError.create({ id: claim.id });
      await inRowOwner(isolation, OUTBOX_ACTOR_ID, claim.ownerId, claim.id, () =>
        outbox.remove(claim.id),
      );
      removed.add(claim.id);
    }
    if (claims.length < BATCH) break;
  }
  await inbox.prune(cutoff);
  return { dead: removed.size };
}
