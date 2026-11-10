/**
 * Stackra file contract:
 * Purpose: unit tests of `SecretsConfig`: keyed `config.secrets`, its defaults equal to `SecretsOptions`' initializers,
 *          `store` takes `memory` (the default) or `aws_secrets_manager` and nothing else, the committed manifest names
 *          it as the `SecretStore` selector, and a member that injects `SecretStore` boots with no secrets config.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0173; ADR 0294 (decision 26).
 */
import { readFileSync } from "node:fs";

import { Module } from "@stackra/container";
import { createTestingModule, registerWiring } from "@stackra/container/testing";
import { describe, expect, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import { SecretsConfig } from "#config/secrets.config";
import { SecretStore } from "#contracts/ports/secret-store.port";
import { SECRETS_CONFIG_SCHEMA } from "#core/constants/secrets-config-schema.constant";
import { MemorySecretStoreDriver } from "#core/drivers/memory-secret-store.driver";
import { buildConfig } from "#core/functions/build-config.function";
import { configKey } from "#core/functions/config-key.function";
import { SecretsOptions } from "#core/schemas/secrets-options.schema";

describe("SecretsConfig", () => {
  it("is keyed config.secrets with defaults equal to the initializers", () => {
    expect(configKey(SecretsConfig, "config")).toBe("config.secrets");
    expect(schemaOf(SecretsOptions)).toBe(SECRETS_CONFIG_SCHEMA);
    expect({ ...new SecretsOptions() }).toEqual(SECRETS_CONFIG_SCHEMA.parse({}));
  });

  it("picks the SecretStore driver: memory by default, aws_secrets_manager by config, nothing else", () => {
    expect(buildConfig(SecretsConfig).store).toBe("memory");
    expect(buildConfig(SecretsConfig, { values: { store: "aws_secrets_manager" } }).store).toBe(
      "aws_secrets_manager",
    );
    expect(SECRETS_CONFIG_SCHEMA.safeParse({ store: "vault" }).success).toBe(false);
  });

  it("selects the SecretStore driver, so the committed manifest names it as the selector", () => {
    const manifest = JSON.parse(
      readFileSync(new URL("../../../stackra.manifest.json", import.meta.url), "utf8"),
    ) as { drivers: { key: string; selectedBy?: string; config?: { class: string } }[] };
    expect(manifest.drivers.find((driver) => driver.key === "config.SecretStore")).toMatchObject({
      selectedBy: "config:config.secrets.store",
      config: { class: "SecretsConfig" },
    });
  });

  it("boots a member that injects SecretStore with no secrets config, on the memory driver", async () => {
    class SecretsHostModule extends Module({}) {}
    registerWiring({
      member: "config",
      root: SecretsHostModule,
      modules: { config: { exports: [], dependsOn: [] } },
      bindings: [],
      config: [{ key: "config.secrets", provide: SecretsConfig }],
      drivers: [
        {
          port: SecretStore,
          key: "config.SecretStore",
          selectedBy: "config:config.secrets.store",
          candidates: {
            memory: () => Promise.resolve(MemorySecretStoreDriver),
            aws_secrets_manager: () => Promise.reject(new Error("not loaded without the SDK")),
          },
        },
      ],
    });
    const app = await createTestingModule(SecretsHostModule).compile();
    expect(app.get(SecretStore)).toBeInstanceOf(MemorySecretStoreDriver);
  });
});
