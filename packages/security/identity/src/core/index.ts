/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/identity (the configuration with its shipped schema, the flows
 *          and statuses, the session service, the session drivers, the claims mapping, the `ClientSession` and memory
 *          `IdentityResolver` drivers, and the refusals) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. `SessionStore`, `SignInBrowser` and `SessionUser` are exported
 *           from `./contracts` only (ADR 0294 decision 15). The shipped schema is re-exported under its generated name
 *           (`IdentityConfig$`). The session-user schema and the PKCE helpers (random tokens, the code challenge, the
 *           JWT payload reader) stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { IdentityConfig } from "#config/identity.config";
export { IDENTITY_CLAIMS } from "#core/constants/identity-claims.constant";
export { IDENTITY_CONFIG_SCHEMA as IdentityConfig$ } from "#core/constants/identity-config-schema.constant";
export { BffSessionStoreDriver } from "#core/drivers/bff-session-store.driver";
export { MemoryIdentityResolverDriver } from "#core/drivers/memory-identity-resolver.driver";
export { MemorySessionStoreDriver } from "#core/drivers/memory-session-store.driver";
export { PkceSessionStoreDriver } from "#core/drivers/pkce-session-store.driver";
export { SessionClientSessionDriver } from "#core/drivers/session-client-session.driver";
export { AuthFlow } from "#core/enums/auth-flow.enum";
export { SessionStatus } from "#core/enums/session-status.enum";
export { SessionRevokedError } from "#core/errors/session-revoked.error";
export { SignInCancelledError } from "#core/errors/sign-in-cancelled.error";
export { sessionUserOf } from "#core/functions/session-user-of.function";
export { IdentityOptions } from "#core/schemas/identity-options.schema";
export { SessionService } from "#core/services/session.service";
export type { SessionState } from "#core/types/session-state.type";
