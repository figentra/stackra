/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/tenancy (`useTenant`, `useTenantSwitcher` and the
 *          `TenantMembership` type they return, and the kit's web `TenantMenu`) until `stackra gen` writes the entry
 *          barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` only, plus the membership type's declaring file,
 *           which `.` does not export (one symbol, one entry, ADR 0294 d15). The hooks serve React DOM and React Native
 *           alike, so the `./native` entry holds only the native blocks.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0504 (module UI kits); the STA-347 stand-in barrel decision.
 */
export type { TenantMembership } from "#core/types/tenant-membership.type";
export { useTenant } from "#react/tenant/use-tenant";
export { useTenantSwitcher } from "#react/tenant/use-tenant-switcher";
export { TenantMenu } from "#react/tenant-menu/tenant-menu";
export type { TenantMenuProps } from "#react/tenant-menu/tenant-menu.props";
