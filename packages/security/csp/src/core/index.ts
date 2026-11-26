/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/csp (the configuration, the policy builder, the header name,
 *          the other security headers, the nonce, the framer check a host runs where it stores framers, and the rich-text
 *          HTML sanitizer) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The configuration class lives in `src/config/` (ADR 0294
 *           decision 19) and is exported here. The baseline, the source and nonce grammars, `cspSource` and the
 *           schema `CspOptions` stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { CspConfig } from "#config/csp.config";
export { RICH_TEXT_HTML_POLICY } from "#core/constants/rich-text-html-policy.constant";
export { contentSecurityPolicy } from "#core/functions/content-security-policy.function";
export { createNonce } from "#core/functions/create-nonce.function";
export { cspHeaderName } from "#core/functions/csp-header-name.function";
export { frameAncestorOrigin } from "#core/functions/frame-ancestor-origin.function";
export { frameAncestorsEntry } from "#core/functions/frame-ancestors-entry.function";
export { sanitizeHtml } from "#core/functions/sanitize-html.function";
export { securityHeaders } from "#core/functions/security-headers.function";
export type { CspAdditions } from "#core/types/csp-additions.type";
export type { HtmlPolicy } from "#core/types/html-policy.type";
export type { PermissionsFeature } from "#core/types/permissions-feature.type";
export type { ReferrerPolicy } from "#core/types/referrer-policy.type";
