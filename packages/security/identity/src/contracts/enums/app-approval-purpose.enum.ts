/**
 * Stackra file contract:
 * Purpose: `AppApprovalPurpose`, what an app approval is for: signing in on another device, or a step-up ("sudo mode")
 *          on a session that is already signed in.
 * Boundary: an `Enum.of` value plus the type of the same name. Both purposes run the same challenge; only the grant's
 *           use differs (a new session, or a fresher authentication on an existing one).
 * Runtime: isomorphic
 * Governing contract: STA-1304 (owner request 2026-10-27); ADR 0207 (decision 1: step-up).
 */
import { Enum } from "@stackra/contracts";

/** The purposes of an app approval. */
export const AppApprovalPurpose = Enum.of({
  /** Sign in on the requesting device. */
  SignIn: "sign_in",
  /** Raise the requesting session's assurance for the step-up window. */
  StepUp: "step_up",
});

/** One of the codes above. */
export type AppApprovalPurpose = Enum.Value<typeof AppApprovalPurpose>;
