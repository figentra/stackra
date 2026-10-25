/**
 * Stackra file contract:
 * Purpose: `ElectionMethod`, how a leader election reaches the other tabs: Web Locks (the browser holds the lock and
 *          frees it when the tab closes), a BroadcastChannel heartbeat (the fallback where Web Locks are missing), or
 *          memory (one JavaScript realm only: React Native, a worker without either API, tests).
 * Boundary: an `Enum.of` value plus the type of the same name. `electLeader` picks the first available in this order
 *           unless its `method` option names one; `LeaderElection.method` reports the one in use.
 * Runtime: isomorphic
 * Governing contract: ADR 0084 (the coordinator row: leader election on @stackra/state); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** The ways a leader election reaches the other participants. */
export const ElectionMethod = Enum.of({
  /** `navigator.locks`: exactly one leader, freed by the browser when the tab goes away. */
  WebLocks: "web_locks",
  /** A `BroadcastChannel` heartbeat: the leader announces itself, the others take over after three missed beats. */
  BroadcastChannel: "broadcast_channel",
  /** One realm only: the first participant of a name leads, the next one leads after it resigns. */
  Memory: "memory",
});

/** One of the codes above. */
export type ElectionMethod = Enum.Value<typeof ElectionMethod>;
