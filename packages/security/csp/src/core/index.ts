/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/csp (the configuration, the policy builder, the header name and
 *          the nonce) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The configuration class lives in `src/config/` (ADR 0294
 *           decision 19) and is exported here. The baseline, the source and nonce grammars, `cspSource` and the
 *           schema `CspOptions` stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { CspConfig } from "#config/csp.config";
export { contentSecurityPolicy } from "#core/functions/content-security-policy.function";
export { createNonce } from "#core/functions/create-nonce.function";
export { cspHeaderName } from "#core/functions/csp-header-name.function";
export type { CspAdditions } from "#core/types/csp-additions.type";
