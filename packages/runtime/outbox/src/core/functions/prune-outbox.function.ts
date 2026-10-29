/**
 * Stackra file contract:
 * Purpose: `pruneOutbox(outbox, inbox, days, now)`, the outbox's retention: deletes dead-lettered messages and received
 *          event ids of the inbox older than `days` before `now`, with one cutoff for both, and answers how many dead
 *          letters went.
 * Boundary: works through the `OutboxDriver` and `InboxDriver` ports only. Live messages are never pruned: a delivered
 *           one is already deleted, a due one waits. The change log has its own retention (`ChangeFeed.maintain`).
 *           The daily prune job of @stackra/data-maintenance calls it with `outbox.pruneAfterDays`; this package
 *           declares no job.
 * Runtime: isomorphic
 * Governing contract: data-layer gap gov6 (the outbox prune); ADR 0078 (decision 4); ADR 0189 (decision 4: data is
 *                     kept no longer than needed); ADR 0462 (decision 1: jobs live in an add-on above iam).
 */
import type { InboxDriver, OutboxDriver } from "#contracts/index";

/** One day in milliseconds. */
const DAY = 86_400_000;

/**
 * Prunes old dead letters and inbox ids.
 *
 * @example
 * const { dead } = await pruneOutbox(outbox, inbox, 30, new Date());
 */
export async function pruneOutbox(
  outbox: OutboxDriver,
  inbox: InboxDriver,
  days: number,
  now: Date,
): Promise<{ readonly dead: number }> {
  const cutoff = new Date(now.getTime() - days * DAY);
  const dead = await outbox.pruneDead(cutoff);
  await inbox.prune(cutoff);
  return { dead };
}
