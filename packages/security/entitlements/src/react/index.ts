/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/entitlements (the entitlements kit's `EntitlementGate`)
 *          until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` and `./contracts` only; `EntitlementGate` draws no
 *           element of its own, so web and native import it from here alike.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0504 (module UI kits); the STA-347 stand-in barrel decision.
 */
export { EntitlementGate } from "#react/entitlement-gate/entitlement-gate";
export type { EntitlementGateProps } from "#react/entitlement-gate/entitlement-gate.props";
