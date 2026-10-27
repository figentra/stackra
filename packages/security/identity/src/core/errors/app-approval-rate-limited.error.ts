/**
 * Stackra file contract:
 * Purpose: `AppApprovalRateLimitedError`, too many app approval requests from one device or for one target within
 *          `IdentityConfig.appApprovalWindowMinutes` (`app_approval_rate_limited`).
 * Boundary: kind `RateLimited`, retryable true. The target is counted by the login hint as typed, so the refusal
 *           comes the same for an account that exists and one that does not.
 * Runtime: isomorphic
 * Governing contract: STA-1304 (owner request 2026-10-27); ADR 0140.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The refusal.
 *
 * @example
 * throw AppApprovalRateLimitedError.create();
 */
export class AppApprovalRateLimitedError extends Refusal({
  kind: ErrorKind.RateLimited,
  retryable: true,
}) {}
