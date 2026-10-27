/**
 * Stackra file contract:
 * Purpose: `MobileCapability`, what one capability flag of a mobile template line switches on: the native modules it
 *          links, the Expo config plugins it runs, and the iOS Info.plist keys and entitlements and Android
 *          permissions it declares. The template line's `capabilities.json` maps each flag to one.
 * Boundary: type only; the data is the template's (the OS mobile template), never a Runway constant. `capabilityConfig`
 *           turns a product's flags and this catalogue into what a build keeps and what it strips.
 * Runtime: node
 * Governing contract: ADR 0439 (decisions 1 and 3: one template, capabilities removed at build time).
 */
import type { ExpoPluginEntry } from "#node/types/expo-plugin-entry.type";

/** One capability flag of a template line. */
export type MobileCapability = {
  /** The npm names of the native modules it links; left out of autolinking when the flag is off. */
  readonly modules?: readonly string[];
  /** The config plugins it runs; run only when the flag is on. */
  readonly plugins?: readonly ExpoPluginEntry[];
  /** Its iOS declarations, removed from the base config when the flag is off. */
  readonly ios?: {
    /** Info.plist keys, `NSCameraUsageDescription`. */
    readonly infoPlist?: readonly string[];
    /** Entitlement keys, `aps-environment`. */
    readonly entitlements?: readonly string[];
  };
  /** Its Android declarations. */
  readonly android?: {
    /** Manifest permissions, `android.permission.CAMERA`; blocked when the flag is off. */
    readonly permissions?: readonly string[];
  };
};
