/**
 * Stackra file contract:
 * Purpose: the `PushTransport` port: how this device receives remote pushes: its push permission, a way to ask for it
 *          or open the OS settings, and the registration that yields the device's push address. Config
 *          `platform.push.provider` picks the driver (`expo`, `self_hosted`, `web`, `memory`).
 * Boundary: an abstract class that is its own token, keyed `platform.PushTransport`. Registering the address with the
 *           devices module and re-registering on a tenant or locale switch is the push context's job; this port only
 *           yields the address. A target with no push binds no driver, so `usePushPermission()` returns `null`.
 * Runtime: isomorphic
 * Governing contract: ADR 0255 (decision 3: push per platform); ADR 0235 (devices); ADR 0294 (decisions 4, 15 and 16).
 */
import { Port } from "@stackra/contracts";

import type { CapabilityResult } from "#contracts/types/capability-result.type";
import type { PermissionStatus } from "#contracts/types/permission-status.type";
import type { PushRegistration } from "#contracts/types/push-registration.type";

/**
 * Remote push on this device.
 *
 * @example
 * const registration = await transport.register();
 * if (registration.ok) await devices.register.queue({ token: registration.data.token });
 */
export abstract class PushTransport extends Port {
  /** Type-only port key, so `DriverName<PushTransport>` narrows to this port's drivers. */
  declare readonly "~key": "platform.PushTransport";

  /** Where the push permission stands now. */
  abstract permission(): Promise<PermissionStatus>;

  /** Asks for the push permission when it is not decided; resolves where it stands afterwards. */
  abstract requestPermission(): Promise<PermissionStatus>;

  /** Opens the OS settings page of this app, where a denied permission can be granted again. */
  abstract openSettings(): Promise<void>;

  /** The device's push address; refuses with `permission_denied` unless the permission is granted. */
  abstract register(): Promise<CapabilityResult<PushRegistration>>;
}
