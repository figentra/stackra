/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/identity (the configuration with its shipped schema, the flows
 *          and statuses, the session service, the session drivers, the claims mapping, the `ClientSession`,
 *          `OfflineSession` and memory `IdentityResolver` drivers, step-up, external sign-in, staff PINs, API keys,
 *          guardians acting for minors, KYC and KYB verification, and the refusals) until `stackra gen` writes the
 *          entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. `SessionStore`, `SignInBrowser` and `SessionUser` are exported
 *           from `./contracts` only (ADR 0294 decision 15). The shipped schema is re-exported under its generated name
 *           (`IdentityConfig$`). The session-user schema and the PKCE helpers (random tokens, the code challenge, the
 *           JWT payload reader), the PIN hash, the CRC and the base-62 helpers stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { IdentityConfig } from "#config/identity.config";
export { IDENTITY_CLAIMS } from "#core/constants/identity-claims.constant";
export { IDENTITY_CONFIG_SCHEMA as IdentityConfig$ } from "#core/constants/identity-config-schema.constant";
export { BffSessionStoreDriver } from "#core/drivers/bff-session-store.driver";
export { MemoryGuardianshipDriver } from "#core/drivers/memory-guardianship.driver";
export { MemoryIdentityResolverDriver } from "#core/drivers/memory-identity-resolver.driver";
export { MemorySessionStoreDriver } from "#core/drivers/memory-session-store.driver";
export { MemoryStaffPinStoreDriver } from "#core/drivers/memory-staff-pin-store.driver";
export { MemoryVerificationDriver } from "#core/drivers/memory-verification.driver";
export { PkceSessionStoreDriver } from "#core/drivers/pkce-session-store.driver";
export { SessionClientSessionDriver } from "#core/drivers/session-client-session.driver";
export { SessionOfflineSessionDriver } from "#core/drivers/session-offline-session.driver";
export { StorageStaffPinStoreDriver } from "#core/drivers/storage-staff-pin-store.driver";
export { ApiKeyKind } from "#core/enums/api-key-kind.enum";
export { AssuranceLevel } from "#core/enums/assurance-level.enum";
export { AuthFlow } from "#core/enums/auth-flow.enum";
export { SessionStatus } from "#core/enums/session-status.enum";
export { ApiKeyRejectedError } from "#core/errors/api-key-rejected.error";
export { GuardianshipMissingError } from "#core/errors/guardianship-missing.error";
export { SessionRevokedError } from "#core/errors/session-revoked.error";
export { SignInCancelledError } from "#core/errors/sign-in-cancelled.error";
export { StaffPinLockedError } from "#core/errors/staff-pin-locked.error";
export { StaffPinRejectedError } from "#core/errors/staff-pin-rejected.error";
export { StepUpRequiredError } from "#core/errors/step-up-required.error";
export { VerificationUnavailableError } from "#core/errors/verification-unavailable.error";
export { assuranceOf } from "#core/functions/assurance-of.function";
export { checkPublishableKey } from "#core/functions/check-publishable-key.function";
export { externalSignIn } from "#core/functions/external-sign-in.function";
export { isOriginAllowed } from "#core/functions/is-origin-allowed.function";
export { mintApiKey } from "#core/functions/mint-api-key.function";
export { parseApiKey } from "#core/functions/parse-api-key.function";
export { requireAssurance } from "#core/functions/require-assurance.function";
export { sessionUserOf } from "#core/functions/session-user-of.function";
export { signInProvidersOf } from "#core/functions/sign-in-providers-of.function";
export { stepUpSignIn } from "#core/functions/step-up-sign-in.function";
export { IdentityOptions } from "#core/schemas/identity-options.schema";
export { GuardianActingService } from "#core/services/guardian-acting.service";
export { SessionService } from "#core/services/session.service";
export { StaffPinService } from "#core/services/staff-pin.service";
export { VerificationService } from "#core/services/verification.service";
export type { ActForOptions } from "#core/types/act-for-options.type";
export type { Assurance } from "#core/types/assurance.type";
export type { DelegatedPrincipal } from "#core/types/delegated-principal.type";
export type { ManagerOverride } from "#core/types/manager-override.type";
export type { ParsedApiKey } from "#core/types/parsed-api-key.type";
export type { SessionState } from "#core/types/session-state.type";
export type { StaffSwitch } from "#core/types/staff-switch.type";
