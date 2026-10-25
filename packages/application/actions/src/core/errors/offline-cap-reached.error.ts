/**
 * Stackra file contract:
 * Purpose: `OfflineCapReachedError` (`offline_cap_reached`), the refusal of a device's offline call to a capped action
 *          once its `offline.cap` (count or amount) is reached within the window.
 * Boundary: one code on both sides: the client queue refuses with it offline, and the pipeline reconciles a device's
 *           replayed calls and refuses beyond the cap with it. A precondition refusal (412), not retryable: the call
 *           needs the network or a person, not a retry. It settles the call's sequence like any refusal.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 5: caps per action, with the refusal of the action pipeline); ADR 0137; ADR
 *                     0140.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The device used up the action's offline cap for this window.
 *
 * @example
 * throw OfflineCapReachedError.create();
 */
export class OfflineCapReachedError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {}
