/**
 * Stackra file contract:
 * Purpose: unit tests of `InfisicalConfig`, `InfisicalOptions` and `INFISICAL_CONFIG_SCHEMA`: keyed
 *          `config.infisical`, built with the shipped defaults, the credentials filled only from the secret layer and
 *          never enumerable, and a non-URL site or a relative folder refused.
 * Boundary: test only; the credential values are made-up canaries.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0173; ADR 0294 (decisions 19, 20 and 26).
 */
import { describe, expect, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import { InfisicalConfig } from "#config/infisical.config";
import { SecretStore } from "#contracts/ports/secret-store.port";
import { INFISICAL_CONFIG_SCHEMA } from "#core/constants/infisical-config-schema.constant";
import { ConfigInvalidError } from "#core/errors/config-invalid.error";
import { buildConfig } from "#core/functions/build-config.function";
import { configKey } from "#core/functions/config-key.function";
import { InfisicalOptions } from "#core/schemas/infisical-options.schema";

class Platform extends SecretStore {
  get(name: string): string | undefined {
    return { INFISICAL_CLIENT_ID: "canary-id", INFISICAL_CLIENT_SECRET: "canary-secret" }[name];
  }
}

describe("InfisicalConfig", () => {
  it("is keyed config.infisical and registered with its schema", () => {
    expect(configKey(InfisicalConfig, "config")).toBe("config.infisical");
    expect(schemaOf(InfisicalOptions)).toBe(INFISICAL_CONFIG_SCHEMA);
  });

  it("fills the credentials from the secret layer only, never enumerable", () => {
    const config = buildConfig(InfisicalConfig, {
      values: { siteUrl: "https://secrets.example.test", projectId: "p", environment: "dev" },
      secrets: new Platform(),
    });
    expect(config.clientId).toBe("canary-id");
    expect(config.clientSecret).toBe("canary-secret");
    expect(JSON.stringify(config)).not.toContain("canary");
  });

  it("refuses a non-URL site and a relative folder", () => {
    expect(() => buildConfig(InfisicalConfig, { values: { siteUrl: "nope" } })).toThrow(
      ConfigInvalidError,
    );
    expect(() => buildConfig(InfisicalConfig, { values: { path: "app" } })).toThrow(
      ConfigInvalidError,
    );
  });
});
