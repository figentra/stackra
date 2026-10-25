/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/identity (the `SessionStore`, `SignInBrowser`,
 *          `Verification`, `StaffPinStore` and `Guardianship` ports, and the types and enums their signatures name)
 *          until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package. Each
 *           symbol here is exported from this entry only (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { VerificationKind } from "#contracts/enums/verification-kind.enum";
export { VerificationStatus } from "#contracts/enums/verification-status.enum";
export { Guardianship } from "#contracts/ports/guardianship.port";
export { SessionStore } from "#contracts/ports/session-store.port";
export { SignInBrowser } from "#contracts/ports/sign-in-browser.port";
export { StaffPinStore } from "#contracts/ports/staff-pin-store.port";
export { Verification } from "#contracts/ports/verification.port";
export type { GuardianLink } from "#contracts/types/guardian-link.type";
export type { SessionUser } from "#contracts/types/session-user.type";
export type { SignInOptions } from "#contracts/types/sign-in-options.type";
export type { StaffPinCredential } from "#contracts/types/staff-pin-credential.type";
export type { VerificationRequest } from "#contracts/types/verification-request.type";
export type { VerificationResult } from "#contracts/types/verification-result.type";
