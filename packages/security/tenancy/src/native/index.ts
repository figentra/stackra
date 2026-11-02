/**
 * Stackra file contract:
 * Purpose: the `@stackra/tenancy/native` entry: the tenancy kit's native blocks. The hooks they read (`useTenant`,
 *          `useTenantSwitcher`) are isomorphic and stay in `./react`, which native code imports too.
 * Boundary: barrel only; one symbol, one entry (ADR 0294 decision 15). A stand-in for the barrel gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: ADR 0504 (module UI kits); ADR 0294 (decision 15).
 */
export { TenantMenu } from "#native/tenant-menu/tenant-menu";
export type { TenantMenuProps } from "#native/tenant-menu/tenant-menu.props";
