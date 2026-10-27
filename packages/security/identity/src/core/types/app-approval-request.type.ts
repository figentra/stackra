/**
 * Stackra file contract:
 * Purpose: `AppApprovalRequest`, what the requesting device asks `AppApprovalService.request` for: the purpose, who is
 *          asking, and the account, given as a principal (a step-up, or a known user), a login hint (the address typed
 *          on the sign-in page), or neither (a QR sign-in, where the scanning app names the account).
 * Boundary: a type only. A step-up names the principal and the session it raises.
 * Runtime: isomorphic
 * Governing contract: STA-1304 (owner request 2026-10-27).
 */
import type { PublicId } from "@stackra/contracts";

import type { AppApprovalPurpose, AppApprovalRequester } from "#contracts/index";

/** One request. */
export interface AppApprovalRequest {
  /** Sign-in or step-up. */
  readonly purpose: AppApprovalPurpose;

  /** Who is asking. */
  readonly requester: AppApprovalRequester;

  /** The account, when the requester knows it (a step-up always does). */
  readonly principal?: PublicId<"usr">;

  /** The verified address typed on the sign-in page. */
  readonly loginHint?: string;

  /** The session a step-up raises. */
  readonly sessionId?: string;
}
