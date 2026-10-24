/**
 * Stackra file contract:
 * Purpose: `electByWebLocks(name, isLeader)`, the Web Locks method: request the election's exclusive lock and hold it
 *          while leading. The browser grants it to one tab at a time, queues the others, and frees it when the leading
 *          tab closes or crashes, so there is never more than one leader.
 * Boundary: sets `isLeader` to `true` when the lock is granted; the caller sets it back to `false` after calling the
 *           returned leave function, which frees a held lock or withdraws a queued request.
 * Runtime: browser
 * Governing contract: ADR 0084 (the coordinator row); ADR 0079 (decision 6).
 */
import { ELECTION_PREFIX } from "#core/constants/election-prefix.constant";
import type { LeaderFlag } from "#core/types/leader-flag.type";

/** Joins the election through Web Locks; returns the function that leaves it. */
export function electByWebLocks(name: string, isLeader: LeaderFlag): () => void {
  const abort = new AbortController();
  let release: (() => void) | undefined;
  navigator.locks
    .request(
      `${ELECTION_PREFIX}${name}`,
      { signal: abort.signal },
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
          isLeader.set(true);
        }),
    )
    .catch((error: unknown) => {
      // A withdrawn request rejects with an AbortError; anything else is the browser refusing the lock.
      if (!abort.signal.aborted) throw error;
    });
  return () => {
    if (release === undefined) abort.abort();
    else release();
  };
}
