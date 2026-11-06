/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/tenancy (`useTenant`, `useTenantSwitcher` and the
 *          `TenantMembership` type they return, and the kit's web `TenantMenu`, `TenantPicker`, `MemberPicker`,
 *          `OrganizationPage` and `MembersPage`) until `stackra gen` writes the entry barrels (STA-339).
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
export { MemberPicker } from "#react/member-picker/member-picker";
export type { MemberPickerProps } from "#react/member-picker/member-picker.props";
export { MembersPage } from "#react/members-page/members-page";
export type { MembersPageProps } from "#react/members-page/members-page.props";
export { OrganizationPage } from "#react/organization-page/organization-page";
export type { OrganizationPageProps } from "#react/organization-page/organization-page.props";
export { TenantPicker } from "#react/tenant-picker/tenant-picker";
export type { TenantPickerProps } from "#react/tenant-picker/tenant-picker.props";
