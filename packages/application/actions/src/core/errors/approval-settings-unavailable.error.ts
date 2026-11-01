/**
 * Stackra file contract:
 * Purpose: `ApprovalSettingsUnavailableError` (`approval_settings_unavailable`), the refusal when an approval condition
 *          declares settings keys to read and no `ApprovalSettingsSource` is bound.
 * Boundary: raised by the pipeline before `needed()` runs, so a call is never read as "not needed" for want of a threshold
 *           (fail closed). Kind `Unavailable` (503), not retryable: the same call fails until a source is bound, which is a
 *           deployment change. A condition with no `reads` never meets it.
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (a condition that cannot read fails the call); ADR 0140 (envelope and kinds); STA-1724
 *                     FR-002.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The settings an approval condition reads cannot be read.
 *
 * @example
 * throw ApprovalSettingsUnavailableError.create();
 */
export class ApprovalSettingsUnavailableError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: false,
}) {}
