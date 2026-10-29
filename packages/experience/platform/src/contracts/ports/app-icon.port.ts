/**
 * Stackra file contract:
 * Purpose: the `AppIcon` port: which of the app's icons the home screen shows (the default or one alternate icon per
 *          brand, season or tenant) and switching between them; a switch the device cannot make resolves a typed
 *          refusal (`unavailable` on `app_icon`), never an exception.
 * Boundary: an abstract class that is its own token, keyed `platform.AppIcon`; a driver per target implements it with
 *           `extends Driver(AppIcon)` (memory, Expo). It never draws or places an icon: the set is generated from the
 *           brand kit into the native project at build time, and `AppIconConfig.icons` names it.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 2); ADR 0478 (a maintained Expo library, no hand-written native code).
 */
import { Port } from "@stackra/contracts";

import type { CapabilityResult } from "#contracts/types/capability-result.type";
import type { ReadonlySignal } from "#contracts/types/readonly-signal.type";

/**
 * Reads and switches the app's home-screen icon.
 *
 * @example
 * const appIcon = useContainer().get(AppIcon);
 * const shown = await appIcon.set("Ramadan"); // refused `unavailable` on a device without alternate icons
 * await appIcon.set(null); // back to the default icon
 */
export abstract class AppIcon extends Port {
  /** Type-only port key, so `DriverName<AppIcon>` narrows to this port's drivers. */
  declare readonly "~key": "platform.AppIcon";

  /** Whether this device lets the app change its icon. */
  abstract readonly isSupported: boolean;

  /** The alternate icon showing now; `null` is the default icon. */
  abstract readonly current: ReadonlySignal<string | null>;

  /** Shows the alternate icon `name`, or the default icon for `null`; refuses `unavailable` when it cannot. */
  abstract set(name: string | null): Promise<CapabilityResult>;
}
