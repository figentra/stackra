/**
 * Stackra file contract:
 * Purpose: `MobileCapabilityConfig`, what a build keeps and strips for a product's capability flags: the config
 *          plugins to run, the native modules to leave out of autolinking, and the iOS Info.plist keys, entitlements
 *          and Android permissions to remove or block.
 * Boundary: type only; `capabilityConfig` builds it, `expoConfigOf` applies it. A declaration an enabled capability
 *           also uses is never stripped.
 * Runtime: node
 * Governing contract: ADR 0439 (decision 3); app-shells section 15 point 3.
 */
import type { ExpoPluginEntry } from "#node/types/expo-plugin-entry.type";

/** The build-time result of a product's capability flags. */
export type MobileCapabilityConfig = {
  /** The config plugins of the enabled flags, in catalogue order, each once. */
  readonly plugins: readonly ExpoPluginEntry[];
  /** The plugin names of the disabled flags, removed from the template's base `plugins`. */
  readonly removedPlugins: readonly string[];
  /** The native modules of the disabled flags: `expo.autolinking.exclude`. */
  readonly excludedModules: readonly string[];
  /** The Info.plist keys of the disabled flags, removed from `ios.infoPlist`. */
  readonly removedInfoPlist: readonly string[];
  /** The entitlement keys of the disabled flags, removed from `ios.entitlements`. */
  readonly removedEntitlements: readonly string[];
  /**
   * The Android permissions of the disabled flags, plus `com.google.android.gms.permission.AD_ID` unless an enabled
   * flag lists it: `android.blockedPermissions`.
   */
  readonly blockedPermissions: readonly string[];
};
