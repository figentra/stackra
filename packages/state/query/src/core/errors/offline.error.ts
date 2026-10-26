/**
 * Stackra file contract:
 * Purpose: `OfflineError` (`offline`), the refusal of a call the offline map does not let the queue hold: the action
 *          is online-only, so it refuses at once instead of waiting for a network that is not there.
 * Boundary: thrown by `MutationQueue.enqueue` before anything is stored; an `unavailable` refusal (a retry once online
 *           may succeed). `action` is the versioned key that was refused.
 * Runtime: isomorphic
 * Governing contract: ADR 0252 (decision 2: the `offline` option, online-only by default); ADR 0140; ADR 0232.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The action cannot run offline and may not be queued.
 *
 * @example
 * throw OfflineError.create({ action: "orders.order.cancel@1" });
 */
export class OfflineError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: true,
}) {
  /** The refused action's versioned key. */
  action!: string;
}
