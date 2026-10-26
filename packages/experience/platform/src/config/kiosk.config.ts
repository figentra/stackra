/**
 * Stackra file contract:
 * Purpose: `KioskConfig`, the kiosk configuration (key `platform.kiosk`): enter the kiosk lock on launch, the idle
 *          reset timeout, and the reach, high-contrast and audio defaults.
 * Boundary: a configuration class over `KioskOptions` with no env map. A host overrides it as
 *           `class KioskConfig extends BaseKioskConfig` with `override` members only; a device's settings override
 *           the values at run time.
 * Runtime: isomorphic
 * Governing contract: ADR 0428 (decisions 1 and 2); ADR 0294 (decisions 19 and 20); ADR 0146 as amended.
 */
import { Config } from "@stackra/config";

import { KioskOptions } from "#core/schemas/kiosk-options.schema";

/**
 * The kiosk configuration.
 *
 * @example
 * import { KioskConfig as BaseKioskConfig } from "@stackra/platform";
 *
 * export class KioskConfig extends BaseKioskConfig {
 *   override enterOnLaunch = true;
 * }
 */
export class KioskConfig extends Config({ schema: KioskOptions }) {}
