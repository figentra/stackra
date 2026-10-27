/**
 * Stackra file contract:
 * Purpose: `AppApprovalGrant`, what completing an approved challenge hands the requester's host once: the principal,
 *          the purpose, the session a step-up raises, the assurance the approval reached and until when it counts.
 * Boundary: a type only. The host's BFF turns a sign-in grant into a session at the identity provider and a step-up
 *           grant into a fresher authentication on `sessionId`; `requireAssurance` then reads `assurance`.
 * Runtime: isomorphic
 * Governing contract: STA-1304 (owner request 2026-10-27); ADR 0207 (decision 1).
 */
import type { PublicId } from "@stackra/contracts";

import type { AppApprovalPurpose } from "#contracts/index";
import type { Assurance } from "#core/types/assurance.type";

/** One completed approval. */
export interface AppApprovalGrant {
  /** The account that approved. */
  readonly principal: PublicId<"usr">;

  /** Sign-in or step-up. */
  readonly purpose: AppApprovalPurpose;

  /** The session a step-up raises. */
  readonly sessionId?: string;

  /** `IdentityConfig.appApprovalAssurance`, authenticated when the app approved. */
  readonly assurance: Assurance;

  /** The end of the step-up window (`stepUpMaxAgeMinutes` after the approval). */
  readonly freshUntil: Date;
}
