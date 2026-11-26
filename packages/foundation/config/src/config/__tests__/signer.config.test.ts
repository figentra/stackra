/**
 * Stackra file contract:
 * Purpose: unit tests of `SignerConfig`, its shape and `SIGNER_CONFIG_SCHEMA`: keyed `config.signer`, built with the
 *          shipped defaults (equal to the initializers), and taking a key id and a KMS key.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 19, 20 and 26).
 */
import { readFileSync } from "node:fs";

import { Module } from "@stackra/container";
import { createTestingModule, registerWiring } from "@stackra/container/testing";
import { Signer } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import { SignerConfig } from "#config/signer.config";
import { SIGNER_CONFIG_SCHEMA } from "#core/constants/signer-config-schema.constant";
import { EphemeralSignerDriver } from "#core/drivers/ephemeral-signer.driver";
import { KmsSignerDriver } from "#core/drivers/kms-signer.driver";
import { buildConfig } from "#core/functions/build-config.function";
import { configKey } from "#core/functions/config-key.function";
import { SignerOptions } from "#core/schemas/signer-options.schema";

describe("SignerConfig", () => {
  it("is keyed config.signer with defaults equal to the initializers", () => {
    expect(configKey(SignerConfig, "config")).toBe("config.signer");
    expect(schemaOf(SignerOptions)).toBe(SIGNER_CONFIG_SCHEMA);
    expect({ ...new SignerOptions() }).toEqual(SIGNER_CONFIG_SCHEMA.parse({}));
  });

  it("takes a key id and a KMS key", () => {
    const config = buildConfig(SignerConfig, {
      values: { keyId: "usage-2026", kmsKeyId: "alias/usage-signing" },
    });
    expect(config.keyId).toBe("usage-2026");
    expect(config.kmsKeyId).toBe("alias/usage-signing");
  });

  it("picks the Signer driver: ephemeral by default, kms by config, nothing else", () => {
    expect(buildConfig(SignerConfig).driver).toBe("ephemeral");
    expect(buildConfig(SignerConfig, { values: { driver: "kms" } }).driver).toBe("kms");
    expect(SIGNER_CONFIG_SCHEMA.safeParse({ driver: "hsm" }).success).toBe(false);
  });

  it("selects the Signer driver, so the committed manifest names it as the selector", () => {
    const manifest = JSON.parse(
      readFileSync(new URL("../../../stackra.manifest.json", import.meta.url), "utf8"),
    ) as { drivers: { key: string; selectedBy?: string; config?: { class: string } }[] };
    expect(manifest.drivers.find((driver) => driver.key === "contracts.Signer")).toMatchObject({
      selectedBy: "config:config.signer.driver",
      config: { class: "SignerConfig" },
    });
  });

  it("boots a member that injects Signer with no signer config, on the ephemeral driver", async () => {
    class SignerHostModule extends Module({}) {}
    registerWiring({
      member: "config",
      root: SignerHostModule,
      modules: { config: { exports: [], dependsOn: [] } },
      bindings: [],
      config: [{ key: "config.signer", provide: SignerConfig }],
      drivers: [
        {
          port: Signer,
          key: "contracts.Signer",
          selectedBy: "config:config.signer.driver",
          candidates: {
            ephemeral: () => Promise.resolve(EphemeralSignerDriver),
            kms: () => Promise.resolve(KmsSignerDriver),
          },
        },
      ],
    });
    const app = await createTestingModule(SignerHostModule).compile();
    expect(app.get(Signer)).toBeInstanceOf(EphemeralSignerDriver);
  });
});
