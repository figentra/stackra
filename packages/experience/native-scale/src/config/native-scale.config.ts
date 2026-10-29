/**
 * Stackra file contract:
 * Purpose: `NativeScaleConfig`, the native scale configuration (key `native_scale`): the protocol driver gen's wiring
 *          selects by `config:native_scale.protocol`, the link the module opens and the protocol pack.
 * Boundary: a configuration class over `NativeScaleOptions` with no env map; runway's `config.native_scale` layer sets
 *           it per device. A host overrides it as `class NativeScaleConfig extends BaseNativeScaleConfig` with
 *           `override` members only, inheriting the key. The drivers read it when they run.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0266 (decision 5); ADR 0478 (decision 5).
 */
import { Config } from "@stackra/config";

import { NativeScaleOptions } from "#core/schemas/native-scale-options.schema";

/**
 * The native scale configuration.
 *
 * @example
 * import { NativeScaleConfig as BaseNativeScaleConfig } from "@stackra/native-scale";
 *
 * export class NativeScaleConfig extends BaseNativeScaleConfig {
 *   override transport: ScaleTransport = ScaleTransport.Spp;
 *   override address = "00:11:22:33:44:55";
 * }
 */
export class NativeScaleConfig extends Config({ schema: NativeScaleOptions }) {}
