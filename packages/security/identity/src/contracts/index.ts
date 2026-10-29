/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/identity (the `AccountDeletions`, `SessionStore`, `SignInBrowser`,
 *          `Verification`, `StaffPinStore`, `Guardianship`, `ApiKeyStore`, `IdpAdmin`, `AutomationPrincipals` and
 *          `AppApprovalChallenges` ports, the `Passkeys` port with `PasskeyRefusal`, the `LoginDirectoryStore` port
 *          with `loginDirectoryPrefix` (the login directory's key format, shared with the edge Worker), and the types
 *          and enums their signatures name)
 *          until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package. Each
 *           symbol here is exported from this entry only (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { AppApprovalPurpose } from "#contracts/enums/app-approval-purpose.enum";
export { AppApprovalStatus } from "#contracts/enums/app-approval-status.enum";
export { DeviceTokenStatus } from "#contracts/enums/device-token-status.enum";
export { IdpSecondFactor } from "#contracts/enums/idp-second-factor.enum";
export { LoginIdentifierKind } from "#contracts/enums/login-identifier-kind.enum";
export { PasskeyRefusal } from "#contracts/enums/passkey-refusal.enum";
export { VerificationKind } from "#contracts/enums/verification-kind.enum";
export { VerificationStatus } from "#contracts/enums/verification-status.enum";
export { VerificationUse } from "#contracts/enums/verification-use.enum";
export { loginDirectoryPrefix } from "#contracts/functions/login-directory-prefix.function";
export { AccountDeletions } from "#contracts/ports/account-deletions.port";
export { ApiKeyStore } from "#contracts/ports/api-key-store.port";
export { AppApprovalChallenges } from "#contracts/ports/app-approval-challenges.port";
export { AutomationPrincipals } from "#contracts/ports/automation-principals.port";
export { Guardianship } from "#contracts/ports/guardianship.port";
export { IdpAdmin } from "#contracts/ports/idp-admin.port";
export { LoginDirectoryStore } from "#contracts/ports/login-directory-store.port";
export { Passkeys } from "#contracts/ports/passkeys.port";
export { SessionStore } from "#contracts/ports/session-store.port";
export { SignInBrowser } from "#contracts/ports/sign-in-browser.port";
export { StaffPinStore } from "#contracts/ports/staff-pin-store.port";
export { Verification } from "#contracts/ports/verification.port";
export type { AccountDeletion } from "#contracts/types/account-deletion.type";
export type { AccountDeletionState } from "#contracts/types/account-deletion-state.type";
export type { ApiKeyRecord } from "#contracts/types/api-key-record.type";
export type { AppApprovalChallenge } from "#contracts/types/app-approval-challenge.type";
export type { AppApprovalRequester } from "#contracts/types/app-approval-requester.type";
export type { AutomationPrincipalInput } from "#contracts/types/automation-principal-input.type";
export type { DeviceAuthorization } from "#contracts/types/device-authorization.type";
export type { DeviceTokenResult } from "#contracts/types/device-token-result.type";
export type { GuardianLink } from "#contracts/types/guardian-link.type";
export type { IdpMachineCredential } from "#contracts/types/idp-machine-credential.type";
export type { IdpMachineUserInput } from "#contracts/types/idp-machine-user-input.type";
export type { IdpSessionGrant } from "#contracts/types/idp-session-grant.type";
export type { IdpUserInput } from "#contracts/types/idp-user-input.type";
export type { LoginDirectoryKey } from "#contracts/types/login-directory-key.type";
export type { LoginIdentifier } from "#contracts/types/login-identifier.type";
export type { LoginPolicy } from "#contracts/types/login-policy.type";
export type { PasskeyCreationOptions } from "#contracts/types/passkey-creation-options.type";
export type { PasskeyCredential } from "#contracts/types/passkey-credential.type";
export type { PasskeyRegistrationChallenge } from "#contracts/types/passkey-registration-challenge.type";
export type { PasskeyRequestOptions } from "#contracts/types/passkey-request-options.type";
export type { PasskeyResult } from "#contracts/types/passkey-result.type";
export type { PasskeySignInChallenge } from "#contracts/types/passkey-sign-in-challenge.type";
export type { SessionUser } from "#contracts/types/session-user.type";
export type { SignInOptions } from "#contracts/types/sign-in-options.type";
export type { StaffPinCredential } from "#contracts/types/staff-pin-credential.type";
export type { VerificationCandidate } from "#contracts/types/verification-candidate.type";
export type { VerificationProvider } from "#contracts/types/verification-provider.type";
export type { VerificationRequest } from "#contracts/types/verification-request.type";
export type { VerificationResult } from "#contracts/types/verification-result.type";
