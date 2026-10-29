/**
 * Stackra file contract:
 * Purpose: `NativeShareConfig`, the native share configuration (key `native_share`): what the app takes from other
 *          apps' share sheets and the limits the drivers check.
 * Boundary: a configuration class over `NativeShareOptions` with no env map. A host overrides it as
 *           `class NativeShareConfig extends BaseNativeShareConfig` with `override` members only, inheriting the key,
 *           and passes the same values to the config plugin. The drivers read it when they run.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0478 (decision 5).
 */
import { Config } from "@stackra/config";

import { NativeShareOptions } from "#core/schemas/native-share-options.schema";

/**
 * The native share configuration.
 *
 * @example
 * import { NativeShareConfig as BaseNativeShareConfig } from "@stackra/native-share";
 *
 * export class NativeShareConfig extends BaseNativeShareConfig {
 *   override fileTypes = ["image/*"];
 * }
 */
export class NativeShareConfig extends Config({ schema: NativeShareOptions }) {}
