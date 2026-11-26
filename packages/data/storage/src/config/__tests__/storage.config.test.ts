/**
 * Stackra file contract:
 * Purpose: unit tests of `StorageConfig`: keyed `storage`, its defaults equal to `StorageOptions`' initializers, and
 *          `driver` takes `memory` (the default), `web` or `native` and nothing else.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 26).
 */
import { buildConfig, configKey } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import { StorageConfig } from "#config/storage.config";
import { STORAGE_CONFIG_SCHEMA } from "#core/constants/storage-config-schema.constant";
import { StorageOptions } from "#core/schemas/storage-options.schema";

describe("StorageConfig", () => {
  it("is keyed storage with defaults equal to the initializers", () => {
    expect(configKey(StorageConfig, "storage")).toBe("storage");
    expect(schemaOf(StorageOptions)).toBe(STORAGE_CONFIG_SCHEMA);
    expect({ ...new StorageOptions() }).toEqual(STORAGE_CONFIG_SCHEMA.parse({}));
  });

  it("picks the Storage driver: memory by default, the field's value by config, nothing else", () => {
    expect(buildConfig(StorageConfig).driver).toBe("memory");
    expect(buildConfig(StorageConfig, { values: { driver: "web" } }).driver).toBe("web");
    expect(buildConfig(StorageConfig, { values: { driver: "native" } }).driver).toBe("native");
    expect(STORAGE_CONFIG_SCHEMA.safeParse({ driver: "indexeddb" }).success).toBe(false);
  });
});
