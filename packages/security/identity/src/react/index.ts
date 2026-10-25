/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/identity (`useSession` and the two shapes it returns) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` only. The hook serves React DOM and React Native
 *           alike, so there is no `./native` hook.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export type { SessionValue } from "#react/session/session-value.type";
export type { SignedInSession } from "#react/session/signed-in-session.type";
export { useSession } from "#react/session/use-session";
