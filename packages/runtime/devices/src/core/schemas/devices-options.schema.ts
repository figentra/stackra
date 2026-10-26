/**
 * Stackra file contract:
 * Purpose: `DevicesOptions`, the shape of `DevicesConfig`: where the hub is, how long one call to it may take and how
 *          many attempts a call that is safe to repeat gets.
 * Boundary: a shape class; it registers this package's own schema (`DEVICES_CONFIG_SCHEMA`) for itself when the module
 *           loads, so `buildConfig(DevicesConfig)` validates with no generated file. No credential lives here: the
 *           token comes from the `DeviceCredential` port.
 * Runtime: isomorphic
 * Governing contract: ADR 0235 (decision 2); ADR 0294 (decisions 19 and 26).
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";

import { DEVICES_CONFIG_SCHEMA } from "#core/constants/devices-config-schema.constant";

/**
 * A device's hub settings.
 *
 * @example
 * export class DevicesConfig extends BaseDevicesConfig {
 *   override hubUrl = "https://hub.example.com";
 * }
 */
export class DevicesOptions extends Schema {
  /** Milliseconds one attempt may take before it fails with `RequestTimedOutError`. */
  @Int({ min: 1 })
  timeoutMs = 10_000;

  /** Attempts per call, the first included, for a network failure, a timeout, a 429 or a 503 (1 to 10). */
  @Int({
    min: 1,
    max: 10,
  })
  attempts = 3;

  /** The hub's base URL; the HTTP drivers refuse to start while it is `null`. */
  hubUrl: string | null = null;
}

registerSchemas([[DevicesOptions, DEVICES_CONFIG_SCHEMA]]);
