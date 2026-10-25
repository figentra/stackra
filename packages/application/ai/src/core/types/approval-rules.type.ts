/**
 * Stackra file contract:
 * Purpose: `ApprovalRules`, the three layers `resolveApproval` reads: the platform floor, the organisation's policy and
 *          the user's preferences.
 * Boundary: a type only; each layer is data from its own owner (platform-floor settings, tenant settings, user
 *           settings and the session).
 * Runtime: isomorphic
 * Governing contract: ADR 0360 (decision 6: three layers).
 */
import type { ApprovalFloor } from "#core/types/approval-floor.type";
import type { ApprovalPolicy } from "#core/types/approval-policy.type";
import type { ApprovalPreferences } from "#core/types/approval-preferences.type";

/** The layers of one decision. */
export interface ApprovalRules {
  /** The never-bypass floor. */
  readonly floor: ApprovalFloor;

  /** The organisation's policy. */
  readonly policy: ApprovalPolicy;

  /** The user's preferences. */
  readonly preferences: ApprovalPreferences;
}
