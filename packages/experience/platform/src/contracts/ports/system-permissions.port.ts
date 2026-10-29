/**
 * Stackra file contract:
 * Purpose: the `SystemPermissions` port, the one permission helper of a native app (owner decision 2026-10-29, follow
 *          the system): where camera, location, photos, Bluetooth and microphone stand, asking for one, and the deep
 *          link to this app's page in the OS settings when the OS will not ask again.
 * Boundary: an abstract class that is its own token, keyed `platform.SystemPermissions`; a driver per target implements
 *           it with `extends Driver(SystemPermissions)` (memory, Expo). It never explains: the app shows the translated
 *           reason, `platform::permissions.<permission>.why`, before `request` and `.blocked` with an
 *           `openSettings` button once the answer is `blocked`.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 2, 2026-10-29 note); ADR 0478 (Expo's own libraries).
 */
import { Port } from "@stackra/contracts";

import type { DevicePermission } from "#contracts/types/device-permission.type";
import type { DevicePermissionStatus } from "#contracts/types/device-permission-status.type";

/**
 * Asks for device permissions and reports where they stand.
 *
 * @example
 * const permissions = useContainer().get(SystemPermissions);
 * const answer = await permissions.request("bluetooth");
 * if (answer === "blocked") showHint(t("platform::permissions.bluetooth.blocked"), () => permissions.openSettings());
 */
export abstract class SystemPermissions extends Port {
  /** Type-only port key, so `DriverName<SystemPermissions>` narrows to this port's drivers. */
  declare readonly "~key": "platform.SystemPermissions";

  /** Where `permission` stands now, without prompting. */
  abstract status(permission: DevicePermission): Promise<DevicePermissionStatus>;

  /** Prompts for `permission` when the OS still may; resolves granted, denied or blocked. */
  abstract request(
    permission: DevicePermission,
  ): Promise<Exclude<DevicePermissionStatus, "prompt">>;

  /** Opens this app's page in the OS settings, where a blocked permission is granted again. */
  abstract openSettings(): Promise<void>;
}
