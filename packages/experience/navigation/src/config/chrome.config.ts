/**
 * Stackra file contract:
 * Purpose: `ChromeConfig`, the native chrome of an app (key `navigation.chrome`): the header every screen starts from
 *          and the tab bar's behaviour, read by the generated React Navigation tree while the app runs.
 * Boundary: a configuration class over `ChromeOptions`; an app overrides fields in `src/config/chrome.config.ts`
 *           (`override header = { ...this.header, blur: true }`). Registers its zod schema with
 *           `@stackra/validation` at import until gen writes the package's schema registration.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 34); ADR 0294 (decisions 19 and 20); ADR 0165.
 */
import { Config } from "@stackra/config";
import { registerSchemas } from "@stackra/validation";

import { ChromeConfig$ } from "#core/constants/chrome-config-schema.constant";
import { ChromeOptions } from "#core/schemas/chrome-options.schema";

// shortcut: registered here until gen writes the package's #stackra/schemas registration (registry gap G1, STA-339).
registerSchemas([[ChromeOptions, ChromeConfig$]]);

/**
 * The native chrome.
 *
 * @example
 * // src/config/chrome.config.ts of an app
 * import { BackTitle, ChromeConfig as BaseChromeConfig } from "@stackra/navigation";
 *
 * export class ChromeConfig extends BaseChromeConfig {
 *   override header = { ...this.header, blur: true, backTitle: BackTitle.Minimal };
 *   override tabBar = { ...this.tabBar, minimizeOnScroll: true, sidebarAdaptable: true };
 * }
 */
export class ChromeConfig extends Config({ schema: ChromeOptions }) {}
