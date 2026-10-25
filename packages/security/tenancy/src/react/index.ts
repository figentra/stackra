/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/tenancy (`useTenant`, `useTenantSwitcher` and the
 *          `TenantMembership` type they return) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` only, plus the membership type's declaring file,
 *           which `.` does not export (one symbol, one entry, ADR 0294 d15). The hooks serve React DOM and React Native
 *           alike, so there is no `./native` entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export type { TenantMembership } from "#core/types/tenant-membership.type";
export { useTenant } from "#react/tenant/use-tenant";
export { useTenantSwitcher } from "#react/tenant/use-tenant-switcher";
