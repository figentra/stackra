/**
 * Stackra file contract:
 * Purpose: `maintainChangeLog(feed, now, retain, isolation)`, the change log's retention: `ChangeFeed.maintain` makes
 *          the next days' partitions and drops whole expired ones, then the expired entries it leaves (the Postgres
 *          default partition's) are claimed across tenants and each owner's are deleted in its own isolation.
 * Boundary: works through the `ChangeFeed` and `CallIsolation` ports only; no session with no tenant may delete a
 *           tenant's entry (ADR 0239 amendment, gap A). A claimed entry still there after its owner's delete is refused
 *           (`ClaimNotLoadedError`), so the loop never spins. The daily job of @stackra/data-maintenance calls it with
 *           `outbox.changeRetentionDays`; this package declares no job.
 * Runtime: isomorphic
 * Governing contract: ADR 0078 and ADR 0221 (2026-10-28 amendment: retention by whole partitions); ADR 0239
 *                     (2026-11-07 amendment, gaps A and C); ADR 0462 (decision 1).
 */
import type { CallIsolation } from "@stackra/actions/contracts";
import { Duration } from "@stackra/contracts";

import type { ChangeClaim, ChangeFeed, ChangeLogReport } from "#contracts/index";
import { ClaimNotLoadedError } from "#core/errors/claim-not-loaded.error";
import { inRowOwner } from "#core/functions/in-row-owner.function";

/** Expired entries one claim takes. */
const BATCH = 500;

/**
 * Maintains the change log at `now`, keeping `retain`.
 *
 * @example
 * const report = await maintainChangeLog(feed, new Date(), Duration.days(30), isolation);
 * @throws ClaimNotLoadedError when a claimed entry was not deleted in its owner.
 * @throws RowIsolationMissingError when an owned entry is claimed and no isolation is bound.
 */
export async function maintainChangeLog(
  feed: ChangeFeed,
  now: Date,
  retain: Duration,
  isolation?: CallIsolation,
): Promise<ChangeLogReport> {
  const report = await feed.maintain(now, retain);
  const cutoff = new Date(now.getTime() - Duration.toMilliseconds(retain));
  const removed = new Set<string>();
  for (;;) {
    const claims = await feed.expired(cutoff, BATCH);
    const byOwner = new Map<ChangeClaim["ownerId"], string[]>();
    for (const claim of claims) {
      if (removed.has(claim.position)) throw ClaimNotLoadedError.create({ id: claim.position });
      removed.add(claim.position);
      byOwner.set(claim.ownerId, [...(byOwner.get(claim.ownerId) ?? []), claim.position]);
    }
    for (const [ownerId, positions] of byOwner)
      await inRowOwner(isolation, ownerId, positions[0] ?? "", () => feed.remove(positions));
    if (claims.length < BATCH) break;
  }
  return report;
}
