/**
 * Stackra file contract:
 * Purpose: `RealtimePeer`, one live connection as `RealtimeHub.join` holds it: how to deliver a message to it and how
 *          to close it when its subscribe token expires.
 * Boundary: a type only; each server driver adapts its connection (a stream, a socket, a listener) to it.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1).
 */
import type { RealtimeMessage } from "#contracts/types/realtime-message.type";

/** A connection the hub delivers to. */
export interface RealtimePeer {
  /** Sends one message; a throw drops the peer. */
  deliver: (message: RealtimeMessage) => void;

  /** Ends the connection because its token expired; the client reconnects with a new one. */
  close: () => void;
}
