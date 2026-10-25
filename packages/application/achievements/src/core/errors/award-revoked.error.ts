/**
 * Stackra file contract:
 * Purpose: `AwardRevokedError`, the refusal of a certificate for a revoked award, or of a second revoke. A 412.
 * Boundary: a refusal; it names the award, never the revoke reason.
 * Runtime: isomorphic
 * Governing contract: ADR 0368 (decisions 5 and 6); ADR 0140 (error envelope); ADR 0294 (decision 20).
 */
import type { PublicId } from "@stackra/contracts";
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * An award that is revoked.
 *
 * @example
 * throw AwardRevokedError.create({ awardId });
 */
export class AwardRevokedError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The revoked award. */
  awardId!: PublicId<"awd">;
}
