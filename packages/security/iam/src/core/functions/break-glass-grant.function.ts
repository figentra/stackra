/**
 * Stackra file contract:
 * Purpose: `breakGlassGrant`, how the IAM service opens a time-boxed emergency grant: it checks the reason, the window
 *          and the longest duration allowed, and that an approver is not the requester.
 * Boundary: pure; the longest duration is the caller's setting (`settings:product-default` or a stricter tenant value),
 *           never a number here. It returns the grant to store; the audit and the approval workflow are the IAM
 *           service's.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decision 3); OS-21 (break-glass on live); JUR-335; STA-595.
 */
import { Duration } from "@stackra/contracts";

import type { BreakGlassGrant } from "#contracts/index";

/**
 * A checked break-glass grant.
 *
 * @throws RangeError when the reason is blank, the window is empty or longer than `longest`, or the approver is the
 *         requester.
 * @example
 * const grant = breakGlassGrant({ role, scope, reason, openedBy, startsAt: now, expiresAt }, Duration.parse(setting));
 */
export function breakGlassGrant(request: BreakGlassGrant, longest: Duration): BreakGlassGrant {
  if (request.reason.trim() === "") throw new RangeError("a break-glass grant states its reason");
  const length = request.expiresAt.getTime() - request.startsAt.getTime();
  if (!(length > 0)) throw new RangeError("a break-glass grant ends after it starts");
  if (length > Duration.toMilliseconds(longest))
    throw new RangeError(`a break-glass grant lasts at most ${longest}`);
  if (request.approvedBy !== undefined && request.approvedBy === request.openedBy)
    throw new RangeError("a break-glass grant is approved by someone other than its requester");
  return Object.freeze({ ...request, reason: request.reason.trim() });
}
