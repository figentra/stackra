/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/scope (`useScope`) until `stackra gen` writes the entry
 *          barrels (STA-339).
 * Boundary: names its one re-export and declares nothing. Imports `.` only. The hook serves React DOM and React Native
 *           alike, so the native app imports it from here too and there is no `./native` entry yet (one symbol, one
 *           entry; an entry is exported once its folder holds a file, ADR 0327 d10).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0327 (decision 10); the STA-347 stand-in barrel decision.
 */
export { useScope } from "#react/scope/use-scope";
