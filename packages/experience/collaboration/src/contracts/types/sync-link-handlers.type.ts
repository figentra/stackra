/**
 * Stackra file contract:
 * Purpose: `SyncLinkHandlers`, the callbacks a `SyncTransport` reports one document stream through: opened, an update
 *          from another replica, closed by the network.
 * Boundary: a type only, in the leaf entry. No callback runs before `open` returns. After each `onOpen` the driver
 *           delivers what the other replicas hold, so a reconnect converges. `onClose` is not final: the driver
 *           reconnects by itself; it is never called after `close`.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decisions 1 and 2); ADR 0294 (decision 15).
 */

/** What a document stream reports. */
export interface SyncLinkHandlers {
  /** The stream is up; the owner sends its full state now. */
  onOpen: () => void;

  /** One update from another replica. */
  onUpdate: (update: Uint8Array) => void;

  /** The stream went down without the caller closing it; the driver reconnects. */
  onClose: () => void;
}
