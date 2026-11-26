/**
 * Stackra file contract:
 * Purpose: `StorageConfig`, the configuration that picks this package's `Storage` driver (key `storage`).
 * Boundary: a configuration class over `StorageOptions` with no env map; runway's layer sets it per environment. A
 *           host overrides it as `class StorageConfig extends BaseStorageConfig` with `override` members only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0256.
 */
import { Config } from "@stackra/config";

import { StorageOptions } from "#core/schemas/storage-options.schema";

/**
 * The client storage's configuration.
 *
 * @example
 * const config = buildConfig(StorageConfig, { values: { driver: "memory" } });
 */
export class StorageConfig extends Config({ schema: StorageOptions }) {}
