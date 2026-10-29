/**
 * Stackra file contract:
 * Purpose: `ExpoAppIconDriver`, the `AppIcon` driver of the Expo (phone) target, through expo-alternate-app-icons:
 *          whether the device supports alternate icons, which one shows, and switching.
 * Boundary: device only, and concrete: it imports expo-alternate-app-icons itself (an optional peer the app adds to
 *           its own dependencies, so it links); the constructor takes nothing. `module` is protected so a test subclass
 *           hands a fake in, and a `null` library reads as unsupported: `set` refuses `unavailable` then, and when
 *           the native side rejects a name the build does not carry. The icons themselves are the library's config
 *           plugin entry, which gen writes from the brand kit. iOS confirms a switch with its own alert; Android
 *           swaps the launcher alias, which may close the app.
 * Runtime: react-native
 * Governing contract: ADR 0250 (decision 2); ADR 0478 (a maintained Expo library, no hand-written native code).
 */
import { Driver } from "@stackra/container";
import * as AlternateAppIcons from "expo-alternate-app-icons";

import { AppIcon } from "#contracts/ports/app-icon.port";
import type { CapabilityResult } from "#contracts/types/capability-result.type";
import type { ReadonlySignal } from "#contracts/types/readonly-signal.type";
import { PlatformCapability } from "#core/enums/platform-capability.enum";
import { liveValue } from "#core/functions/live-value.function";
import { refuse } from "#core/functions/refuse.function";
import type { LiveValue } from "#core/types/live-value.type";
import type { ExpoAppIconModule } from "#native/types/expo-app-icon-module.type";

/**
 * The app icon on a phone.
 *
 * @example
 * { provide: AppIcon, useClass: ExpoAppIconDriver }
 */
export class ExpoAppIconDriver extends Driver(AppIcon) {
  /** The library the icon is switched through; a test subclass replaces it. */
  protected readonly module: ExpoAppIconModule = AlternateAppIcons;

  /** The icon showing, once something has read it. */
  private live: LiveValue<string | null> | undefined;

  /** Whether this device supports alternate icons; false without the library. */
  get isSupported(): boolean {
    return this.module?.supportsAlternateIcons === true;
  }

  /** The icon showing now, read from the library on first use. */
  get current(): ReadonlySignal<string | null> {
    return this.icon();
  }

  /** Shows `name`, or the default for `null`; refuses without support or when the native side rejects the name. */
  async set(name: string | null): Promise<CapabilityResult> {
    const module = this.module;
    if (module === null || !module.supportsAlternateIcons) {
      return refuse(PlatformCapability.AppIcon, "unavailable");
    }
    try {
      this.icon().set(await module.setAlternateAppIcon(name));
    } catch {
      return refuse(PlatformCapability.AppIcon, "unavailable"); // the build carries no icon by that name
    }
    return { ok: true, data: undefined };
  }

  /** The live icon, created from the library's answer on first use. */
  private icon(): LiveValue<string | null> {
    this.live ??= liveValue(this.module?.getAppIconName() ?? null);
    return this.live;
  }
}
