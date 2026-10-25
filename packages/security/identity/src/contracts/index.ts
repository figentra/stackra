/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/identity (the `SessionStore` and `SignInBrowser` ports
 *          and the `SessionUser` their signatures name) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package. Each
 *           symbol here is exported from this entry only (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { SessionStore } from "#contracts/ports/session-store.port";
export { SignInBrowser } from "#contracts/ports/sign-in-browser.port";
export type { SessionUser } from "#contracts/types/session-user.type";
