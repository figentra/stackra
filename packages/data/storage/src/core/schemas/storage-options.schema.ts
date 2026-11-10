/**
 * Stackra file contract:
 * Purpose: `StorageOptions`, the shape of `StorageConfig`: which `Storage` driver the member's client storage runs.
 * Boundary: a shape class; it registers this package's own schema (`STORAGE_CONFIG_SCHEMA`) for itself when the
 *           module loads. A driver name only.
 * Runtime: isomorphic
 * Governing contract: ADR 0256; ADR 0146 as amended; ADR 0294 (decisions 19 and 26).
 */
import "#core/types/storage-driver-names.type";

import type { DriverName } from "@stackra/container";
import { registerSchemas, Schema } from "@stackra/validation";

import type { Storage } from "#contracts/ports/storage.port";
import { STORAGE_CONFIG_SCHEMA } from "#core/constants/storage-config-schema.constant";

/**
 * The client storage's settings.
 *
 * @example
 * export class StorageConfig extends BaseStorageConfig {
 *   override driver = "web" as const;
 * }
 */
export class StorageOptions extends Schema {
  /**
   * Which `Storage` driver runs: `memory` (in process, tests and services), `web` (`./browser`) or `native`
   * (`./native`). An app takes `web` or `native` from gen's per-runtime defaults, which come before this selector, so
   * the default lands where gen gives none, such as a service.
   */
  driver: DriverName<Storage> = "memory";
}

registerSchemas([[StorageOptions, STORAGE_CONFIG_SCHEMA]]);
