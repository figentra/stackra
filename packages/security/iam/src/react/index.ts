/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/iam (`usePermission`) until `stackra gen` writes the entry
 *          barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` only; web and native share it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { usePermission } from "#react/permission/use-permission";
