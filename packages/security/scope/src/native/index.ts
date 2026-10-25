/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./native` entry of @stackra/scope (`rememberActiveScope`, the device's remembered
 *          scope) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names its one re-export and declares nothing. Imports `.` only; `useScope` stays in `./react`, which serves
 *           React Native too (one symbol, one entry). The storage key stays internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0327 (decision 10); the STA-347 stand-in barrel decision.
 */
export { rememberActiveScope } from "#native/functions/remember-active-scope.function";
