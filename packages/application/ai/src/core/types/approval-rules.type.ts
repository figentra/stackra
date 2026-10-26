/**
 * Stackra file contract:
 * Purpose: `ApprovalRules`, the layers `resolveApproval` reads: the platform floor and the market pack's floor, the
 *          tenant's permission matrix, the organisation's policy and the user's preferences.
 * Boundary: a type only; each layer is data from its own owner (platform-floor settings, tenant settings, user
 *           settings and the session).
 * Runtime: isomorphic
 * Governing contract: ADR 0360 (decision 6: three layers); X2-12 (the pack-floor source and the matrix layer).
 */
import type { ActionPermissionRow } from "#core/types/action-permission-row.type";
import type { ApprovalFloor } from "#core/types/approval-floor.type";
import type { ApprovalPolicy } from "#core/types/approval-policy.type";
import type { ApprovalPreferences } from "#core/types/approval-preferences.type";

/** The layers of one decision. */
export interface ApprovalRules {
  /** The never-bypass floor (the platform floor's settings). */
  readonly floor: ApprovalFloor;

  /** The market pack's legal floor for the tenant's market; checked with the platform floor, never relaxed. */
  readonly packFloor?: ApprovalFloor;

  /** The tenant's AI action permission matrix rows (`rule-set:os:ai-action-permissions`); none when absent. */
  readonly matrix?: readonly ActionPermissionRow[];

  /** The organisation's policy. */
  readonly policy: ApprovalPolicy;

  /** The user's preferences. */
  readonly preferences: ApprovalPreferences;
}
