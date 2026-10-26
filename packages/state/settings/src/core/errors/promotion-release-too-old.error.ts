/**
 * Stackra file contract:
 * Purpose: `PromotionReleaseTooOldError`, the refusal to apply a promotion change set on a live environment that runs
 *          an older platform release than the change set needs (`promotion_release_too_old`): the sandbox it came from
 *          ran a newer release, so its configuration may name what live does not have yet.
 * Boundary: raised by a `Promotable` driver before anything is applied; kind `FailedPrecondition`, not retryable as
 *           is: live must be upgraded first, then the same change set applies. Its details are the kind and the two
 *           releases.
 * Runtime: isomorphic
 * Governing contract: ADR 0395 (decision 3); ADR 0359 (open question 6); ADR 0140 (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Upgrade live to the change set's release, then apply it again.
 *
 * @example
 * throw PromotionReleaseTooOldError.create({ promotable: "settings", required: "1.4.0", live: "1.3.2" });
 */
export class PromotionReleaseTooOldError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The promotable kind (`kind` is the refusal's own field). */
  promotable!: string;

  /** The release the change set needs. */
  required!: string;

  /** The release live runs. */
  live!: string;
}
