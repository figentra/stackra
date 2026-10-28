/**
 * Stackra file contract:
 * Purpose: `RealtimeLinkHandlers`, the callbacks a `RealtimeTransport` reports one link's life through: opened, a
 *          message, closed by the far side or the network.
 * Boundary: a type only, in the leaf entry. `onClose` is never called for a close the caller asked for, and never
 *           twice; a malformed frame is dropped by the driver and never reaches `onMessage`.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1); ADR 0294 (decision 15).
 */
import type { RealtimeMessage } from "#contracts/types/realtime-message.type";

/** What a link reports. */
export interface RealtimeLinkHandlers {
  /** The link is up and messages may arrive. */
  onOpen: () => void;

  /** One decoded message. */
  onMessage: (message: RealtimeMessage) => void;

  /** The link went down without the caller closing it; the caller decides whether to reconnect. */
  onClose: () => void;
}
