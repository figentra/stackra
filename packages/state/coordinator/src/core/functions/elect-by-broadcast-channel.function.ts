/**
 * Stackra file contract:
 * Purpose: `electByBroadcastChannel(name, isLeader, heartbeatMs)`, the fallback where Web Locks are missing: the leader
 *          posts a heartbeat on the election's BroadcastChannel every `heartbeatMs`; a participant that hears none for
 *          three beats takes over, and one that hears a resignation takes over at once. When two lead at once (both
 *          took over in the same beat), the one with the higher random id steps down on hearing the other.
 * Boundary: best effort: two tabs can both lead for up to one beat, so work a leader does must tolerate a duplicate
 *           (the offline queue's idempotency keys do). A newcomer waits three beats before it may lead. Sets
 *           `isLeader` to `true` on taking over and to `false` on stepping down; the caller sets it to `false` after
 *           calling the returned leave function, which announces the resignation and closes the channel.
 * Runtime: browser
 * Governing contract: ADR 0084 (the coordinator row: Web Locks with a fallback); ADR 0079 (decision 6).
 */
import { ELECTION_PREFIX } from "#core/constants/election-prefix.constant";
import type { ElectionMessage } from "#core/types/election-message.type";
import type { LeaderFlag } from "#core/types/leader-flag.type";

/** Joins the election through a BroadcastChannel heartbeat; returns the function that leaves it. */
export function electByBroadcastChannel(
  name: string,
  isLeader: LeaderFlag,
  heartbeatMs: number,
): () => void {
  // Not crypto.randomUUID: it is missing outside a secure context, which is where this fallback mostly runs.
  const id = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  const channel = new BroadcastChannel(`${ELECTION_PREFIX}${name}`);
  let leaderId: string | undefined;
  let lastHeard = Date.now();

  const post = (type: ElectionMessage["type"]): void => {
    // oxlint-disable-next-line unicorn/require-post-message-target-origin -- reason: a BroadcastChannel has no target origin
    channel.postMessage({ type, id } satisfies ElectionMessage);
  };

  const tick = (): void => {
    if (isLeader.get()) return post("heartbeat");
    if (Date.now() - lastHeard < heartbeatMs * 3) return; // three missed beats
    leaderId = id;
    isLeader.set(true);
    post("heartbeat");
  };

  channel.addEventListener("message", (event: MessageEvent<ElectionMessage>) => {
    const message = event.data;
    if (message.type === "resign") {
      if (message.id !== leaderId) return;
      leaderId = undefined;
      lastHeard = Number.NEGATIVE_INFINITY;
      return tick();
    }
    if (isLeader.get()) {
      if (message.id > id) return; // the other leader steps down when it hears this one
      isLeader.set(false);
    }
    leaderId = message.id;
    lastHeard = Date.now();
  });

  const timer = setInterval(tick, heartbeatMs);
  return () => {
    clearInterval(timer);
    if (isLeader.get()) post("resign");
    channel.close();
  };
}
