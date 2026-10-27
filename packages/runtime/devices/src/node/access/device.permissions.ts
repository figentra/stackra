/**
 * Stackra file contract:
 * Purpose: `DevicePermissions`, the permissions of the devices module's `device` aggregate: `devices.device.read`,
 *          which `DeviceAcknowledgedQuery` runs under.
 * Boundary: declarations only. Reading a device's last acknowledged sequence changes nothing, so it is L0; the query
 *           still answers only for a device inside the caller's scope.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0132 as amended; ADR 0099 (risk); STA-344.
 */
import { Permission, Permissions } from "@stackra/iam";

/**
 * Referenced as `DevicePermissions.read` by roles and policies.
 *
 * @example
 * roles.grant(StaffRole, [DevicePermissions.read]);
 */
export class DevicePermissions extends Permissions {
  /** Read a device's last acknowledged sequence. */
  static readonly read = Permission.L0;
}
