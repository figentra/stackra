/**
 * Stackra file contract:
 * Purpose: `withStackraCardTerminal`, the config plugin of @stackra/native-card-terminal (default export, loaded by
 *          `app.plugin.js` at prebuild): it adds the Bluetooth and location usage strings and background mode, the
 *          Tap to Pay entitlement when the app turns it on, and the Android Bluetooth, location and NFC permissions.
 * Boundary: composes Expo's mods over the pure functions beside it; it writes nothing else into the app (gen's one
 *           plugin keeps every other Stackra modification, ADR 0478 decision 3). Runs at prebuild only, never in the
 *           app bundle.
 * Runtime: node
 * Governing contract: ADR 0479 (decision 6); ADR 0478 (decisions 2 and 3).
 */
import type { ConfigPlugin } from "expo/config-plugins.js";
// The extension is required: Expo CLI loads the built plugin as Node ESM, and `expo` has no exports map.
import { withAndroidManifest, withEntitlementsPlist, withInfoPlist } from "expo/config-plugins.js";

import { applyAndroidManifest } from "#plugin/functions/apply-android-manifest.function";
import { applyIosEntitlements } from "#plugin/functions/apply-ios-entitlements.function";
import { applyIosInfoPlist } from "#plugin/functions/apply-ios-info-plist.function";
import type { AndroidManifestShape } from "#plugin/types/android-manifest-shape.type";
import type { CardTerminalPluginOptions } from "#plugin/types/card-terminal-plugin-options.type";

/**
 * The card terminal's native configuration.
 *
 * @example
 * // app.config: plugins: [["@stackra/native-card-terminal", { isTapToPayEnabled: true }]]
 */
const withStackraCardTerminal: ConfigPlugin<CardTerminalPluginOptions | undefined> = (
  config,
  options = {},
) => {
  let next = withInfoPlist(config, (mod) => {
    mod.modResults = applyIosInfoPlist(mod.modResults, options) as typeof mod.modResults;
    return mod;
  });
  next = withEntitlementsPlist(next, (mod) => {
    mod.modResults = applyIosEntitlements(mod.modResults, options) as typeof mod.modResults;
    return mod;
  });
  return withAndroidManifest(next, (mod) => {
    // reason: Expo's manifest type is an interface without an index signature; the shape is the part edited here.
    applyAndroidManifest(mod.modResults as unknown as AndroidManifestShape);
    return mod;
  });
};

export default withStackraCardTerminal;
