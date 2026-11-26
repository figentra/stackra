/**
 * Stackra file contract:
 * Purpose: unit tests of `TenantKeysConfig` and its shipped `TenantKeysConfig$`: the key, the defaults a boot with no
 *          configuration takes (`ephemeral` and `memory`, no KMS key, a five-minute cache of 1000 tenants) equal to the
 *          schema's, a production layer (`kms`, `postgres`, the region's KMS key), the refusal of a store name no
 *          driver has, and a `KeyProvider` driver a product ships (any non-empty name, STA-2693).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0188 (2026-11-09 amendment); ADR 0294 (decisions 19 and 20).
 */
import { buildConfig, ConfigInvalidError, configKey } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { TenantKeysConfig } from "#config/tenant-keys.config";
import { TENANT_KEYS_CONFIG_SCHEMA } from "#core/constants/tenant-keys-config-schema.constant";

describe("TenantKeysConfig", () => {
  it("is keyed tenancy.tenant_keys and boots with no configuration on the in-process drivers", () => {
    expect(configKey(TenantKeysConfig, "tenancy")).toBe("tenancy.tenant_keys");
    const config = buildConfig(TenantKeysConfig);
    expect({ ...config }).toEqual(TENANT_KEYS_CONFIG_SCHEMA.parse({}));
    expect(config).toMatchObject({
      driver: "ephemeral",
      store: "memory",
      kmsKeyId: "",
      cacheSeconds: 300,
      cacheTenants: 1000,
    });
  });

  it("takes a region's production layer and refuses a store no driver is named", () => {
    const config = buildConfig(TenantKeysConfig, {
      values: {
        driver: "kms",
        store: "postgres",
        kmsKeyId: "alias/tenant-data-keys-eu",
        region: "eu-central-1",
      },
    });
    expect(config).toMatchObject({ driver: "kms", store: "postgres", region: "eu-central-1" });
    expect(() => buildConfig(TenantKeysConfig, { values: { store: "vault" } as never })).toThrow(
      ConfigInvalidError,
    );
  });

  it("takes a KeyProvider driver a product ships, and refuses an empty name (STA-2693)", () => {
    const config = buildConfig(TenantKeysConfig, { values: { driver: "audit" } as never });
    expect(config).toMatchObject({ driver: "audit" });
    expect(() => buildConfig(TenantKeysConfig, { values: { driver: "" } as never })).toThrow(
      ConfigInvalidError,
    );
  });
});
