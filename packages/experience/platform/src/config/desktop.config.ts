/**
 * Stackra file contract:
 * Purpose: `DesktopConfig`, the desktop configuration (key `platform.desktop`) the Electron main process reads while
 *          the app runs: mode, windows, overlays, menus, tray, deep links, auto-update, devices, permissions and
 *          hardening knobs.
 * Boundary: a configuration class over `DesktopOptions` with no env map. A host overrides it as
 *           `class DesktopConfig extends BaseDesktopConfig` with `override` members only, inheriting the key; each
 *           nested object spreads the base first and restates its type (`BaseDesktopConfig["tray"]`).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0281; ADR 0251.
 */
import { Config } from "@stackra/config";

import { DesktopOptions } from "#core/schemas/desktop-options.schema";

/**
 * The desktop configuration.
 *
 * @example
 * import { DesktopConfig as BaseDesktopConfig, DesktopMode } from "@stackra/platform";
 *
 * export class DesktopConfig extends BaseDesktopConfig {
 *   override mode: DesktopMode = DesktopMode.Hybrid;
 *   override deepLinks: BaseDesktopConfig["deepLinks"] = { ...this.deepLinks, scheme: "acme-console" };
 * }
 */
export class DesktopConfig extends Config({ schema: DesktopOptions }) {}
