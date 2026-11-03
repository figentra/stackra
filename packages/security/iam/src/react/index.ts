/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/iam (`usePermission`, and the IAM kit's `Can`,
 *          `RolePicker` and `RolesPage`) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` only; `usePermission` and `Can` serve web and
 *           native alike, while `RolePicker` and `RolesPage` are web blocks over @stackra/ui/react.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0504 (module UI kits); the STA-347 stand-in barrel decision.
 */
export { Can } from "#react/can/can";
export type { CanProps } from "#react/can/can.props";
export { usePermission } from "#react/permission/use-permission";
export { RolePicker } from "#react/role-picker/role-picker";
export type { RolePickerProps } from "#react/role-picker/role-picker.props";
export { RolesPage } from "#react/roles-page/roles-page";
export type { RolesPageProps } from "#react/roles-page/roles-page.props";
