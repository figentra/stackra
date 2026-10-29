/**
 * Stackra file contract:
 * Purpose: `AppIconConfig`, the app icon configuration (key `platform.app_icon`): the alternate icons the build
 *          carries, which `useAppIcon()` offers.
 * Boundary: a configuration class over `AppIconOptions` with no env map. Gen writes the host's override from the brand
 *           kit, with the same names it gives the config plugin; which icon shows is the app's run-time choice.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 2); ADR 0294 (decisions 19 and 20); ADR 0146 as amended.
 */
import { Config } from "@stackra/config";

import { AppIconOptions } from "#core/schemas/app-icon-options.schema";

/**
 * The app icon configuration.
 *
 * @example
 * import { AppIconConfig as BaseAppIconConfig } from "@stackra/platform";
 *
 * export class AppIconConfig extends BaseAppIconConfig {
 *   override icons = ["Ramadan", "Winter"];
 * }
 */
export class AppIconConfig extends Config({ schema: AppIconOptions }) {}
