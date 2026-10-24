/**
 * Stackra file contract:
 * Purpose: `electInMemory(name, isLeader)`, the last fallback, for a realm with neither Web Locks nor BroadcastChannel:
 *          the participants of one name in this realm queue up, the first leads, and the next leads when it leaves.
 * Boundary: one realm only; it cannot see other tabs or processes. Sets `isLeader` to `true` for each new head of the
 *           queue; the caller sets it to `false` after calling the returned leave function.
 * Runtime: isomorphic
 * Governing contract: ADR 0084 (the coordinator row: a fallback); ADR 0079 (decision 6).
 */
import { MEMORY_ELECTIONS } from "#core/constants/memory-elections.constant";
import type { LeaderFlag } from "#core/types/leader-flag.type";

/** Joins the in-memory election; returns the function that leaves it. */
export function electInMemory(name: string, isLeader: LeaderFlag): () => void {
  const queue = MEMORY_ELECTIONS.get(name) ?? [];
  MEMORY_ELECTIONS.set(name, queue);
  queue.push(isLeader);
  queue[0]?.set(true);
  return () => {
    const index = queue.indexOf(isLeader);
    if (index === -1) return;
    queue.splice(index, 1);
    if (queue.length === 0) MEMORY_ELECTIONS.delete(name);
    else queue[0]?.set(true);
  };
}
