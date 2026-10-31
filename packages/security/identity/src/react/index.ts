/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/identity (`useSession` and the two shapes it returns, and
 *          `useAppApprovalWait`, the web's app approval waiting screen, and `useAccountDeletion`, the settings section that
 *          deletes one's own account, and `SignIn`, the sign-in block of the identity module UI kit, ADR 0504) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` only. `useSession` serves React DOM and React
 *           Native alike; the app's approve sheet hook is `./native`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export type { AccountDeletionView } from "#react/account-deletion/account-deletion.type";
export type { AccountDeletionOptions } from "#react/account-deletion/account-deletion-options.type";
export { useAccountDeletion } from "#react/account-deletion/use-account-deletion";
export type { AppApprovalWait } from "#react/app-approval/app-approval-wait.type";
export type { AppApprovalWaitOptions } from "#react/app-approval/app-approval-wait-options.type";
export type { AppApprovalWaitPhase } from "#react/app-approval/app-approval-wait-phase.type";
export { useAppApprovalWait } from "#react/app-approval/use-app-approval-wait";
export { SignIn } from "#react/sign-in/sign-in";
export type { SignInProps } from "#react/sign-in/sign-in.props";
export type { SessionValue } from "#react/session/session-value.type";
export type { SignedInSession } from "#react/session/signed-in-session.type";
export { useSession } from "#react/session/use-session";
