/**
 * Stackra file contract:
 * Purpose: `PromotionBaseStaleError`, the refusal to apply a promotion diff whose live base has changed since it was
 *          computed (`promotion_base_stale`): someone edited live in between, so the reviewed diff no longer says what
 *          applying would do.
 * Boundary: raised by a `Promotable` driver before anything is applied; kind `Conflict` (HTTP 409), not retryable as
 *           is: a new diff must be computed and reviewed. Its details are the kind and the two content hashes.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decision 6, proposed: apply refuses when live moved); ADR 0140 (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Compute a new diff against live and review it again.
 *
 * @example
 * throw PromotionBaseStaleError.create({ promotable: "settings", base: diff.base, live: hash });
 */
export class PromotionBaseStaleError extends Refusal({
  kind: ErrorKind.Conflict,
  retryable: false,
}) {
  /** The promotable kind (`kind` is the refusal's own field). */
  promotable!: string;

  /** The hash the diff was computed against. */
  base!: string;

  /** Live's hash now. */
  live!: string;
}
