/**
 * Stackra file contract:
 * Purpose: `ElectionMessage`, what the BroadcastChannel fallback posts: a leader's heartbeat, or a leader's resignation
 *          so the others take over without waiting for the timeout.
 * Boundary: a type only, internal to the fallback. `id` is the sender's random participant id; the lowest id wins
 *           when two participants lead at once.
 * Runtime: isomorphic
 * Governing contract: ADR 0084 (the coordinator row).
 */

/** One message on an election's BroadcastChannel. */
export interface ElectionMessage {
  /** `heartbeat`: the sender leads. `resign`: the sender stopped leading. */
  readonly type: "heartbeat" | "resign";

  /** The sender's participant id. */
  readonly id: string;
}
