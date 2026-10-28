/**
 * Stackra file contract:
 * Purpose: `applyIosInfoPlist`, the plugin's `Info.plist` edit: the Bluetooth and location usage strings (an app's own
 *          string wins over the option, the option over the English default) and the `bluetooth-central` background
 *          mode, added once.
 * Boundary: pure: returns a new plist and leaves the one passed in untouched.
 * Runtime: node
 * Governing contract: ADR 0479 (decision 6).
 */
import { CARD_TERMINAL_PLUGIN } from "#plugin/constants/card-terminal-plugin.constant";
import type { CardTerminalPluginOptions } from "#plugin/types/card-terminal-plugin-options.type";

/**
 * The plist with the card terminal's entries.
 *
 * @example
 * config.modResults = applyIosInfoPlist(config.modResults, { locationUsage: "…" });
 */
export function applyIosInfoPlist(
  plist: Readonly<Record<string, unknown>>,
  options: CardTerminalPluginOptions,
): Record<string, unknown> {
  const modes = Array.isArray(plist["UIBackgroundModes"])
    ? (plist["UIBackgroundModes"] as readonly unknown[])
    : [];
  return {
    ...plist,
    NSBluetoothAlwaysUsageDescription:
      plist["NSBluetoothAlwaysUsageDescription"] ??
      options.bluetoothUsage ??
      CARD_TERMINAL_PLUGIN.bluetoothUsage,
    NSLocationWhenInUseUsageDescription:
      plist["NSLocationWhenInUseUsageDescription"] ??
      options.locationUsage ??
      CARD_TERMINAL_PLUGIN.locationUsage,
    UIBackgroundModes: modes.includes(CARD_TERMINAL_PLUGIN.backgroundMode)
      ? [...modes]
      : [...modes, CARD_TERMINAL_PLUGIN.backgroundMode],
  };
}
