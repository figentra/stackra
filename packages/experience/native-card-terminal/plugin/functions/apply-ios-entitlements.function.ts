/**
 * Stackra file contract:
 * Purpose: `applyIosEntitlements`, the plugin's entitlements edit: the Tap to Pay on iPhone entitlement when the app
 *          turns Tap to Pay on, and nothing otherwise.
 * Boundary: pure: returns a new entitlements map. Apple grants the entitlement per bundle; the launch-gate row that
 *           turns it on is the app's (ADR 0446 decision 5).
 * Runtime: node
 * Governing contract: ADR 0479 (decisions 6 and 7).
 */
import { CARD_TERMINAL_PLUGIN } from "#plugin/constants/card-terminal-plugin.constant";
import type { CardTerminalPluginOptions } from "#plugin/types/card-terminal-plugin-options.type";

/**
 * The entitlements with Tap to Pay where it is on.
 *
 * @example
 * config.modResults = applyIosEntitlements(config.modResults, { isTapToPayEnabled: true });
 */
export function applyIosEntitlements(
  entitlements: Readonly<Record<string, unknown>>,
  options: CardTerminalPluginOptions,
): Record<string, unknown> {
  if (options.isTapToPayEnabled !== true) return { ...entitlements };
  return { ...entitlements, [CARD_TERMINAL_PLUGIN.tapToPayEntitlement]: true };
}
