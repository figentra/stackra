/**
 * Stackra file contract:
 * Purpose: `DevicesConfig`, a device app's hub configuration (key `devices.devices`): the hub URL, the call timeout and
 *          the attempts per call that the HTTP drivers read.
 * Boundary: a configuration class over `DevicesOptions` with no env map: the URL's variable differs per target, so the
 *           host feeds it from its own env configuration, and runway's `config.devices.devices` layer sets it per
 *           environment. A host overrides it as `class DevicesConfig extends BaseDevicesConfig` with `override`
 *           members only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0235 (decision 2).
 */
import { Config } from "@stackra/config";

import { DevicesOptions } from "#core/schemas/devices-options.schema";

/**
 * A device app's hub configuration.
 *
 * @example
 * import { DevicesConfig as BaseDevicesConfig } from "@stackra/devices";
 *
 * export class DevicesConfig extends BaseDevicesConfig {
 *   override hubUrl = "https://hub.example.com";
 *   override attempts = 5;
 * }
 */
export class DevicesConfig extends Config({ schema: DevicesOptions }) {}
