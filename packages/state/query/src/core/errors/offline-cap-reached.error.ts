/**
 * Stackra file contract:
 * Purpose: `OfflineCapReachedError` (`offline_cap_reached`), the refusal of an offline call once its action's cap is
 *          reached within the window (ADR 0338 decision 5): the client stops taking the call until it is back online.
 * Boundary: thrown by `MutationQueue.enqueue` before anything is stored; a `precondition_failed` refusal, the same code
 *           and kind the server's pipeline uses when it reconciles the capped actions on sync, so a replay it refuses
 *           becomes a conflict record rather than a call that waits forever. `action` is the versioned key refused.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 5); ADR 0137 (refusal codes); ADR 0140; ADR 0232.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The action's offline cap is reached.
 *
 * @example
 * throw OfflineCapReachedError.create({ action: "loyalty.gift_card.redeem@1" });
 */
export class OfflineCapReachedError extends Refusal({ kind: ErrorKind.FailedPrecondition }) {
  /** The refused action's versioned key. */
  action!: string;
}
