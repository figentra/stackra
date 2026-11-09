/**
 * Stackra file contract:
 * Purpose: unit tests of `SignerConfig`, its shape and `SIGNER_CONFIG_SCHEMA`: keyed `config.signer`, built with the
 *          shipped defaults (equal to the initializers), and taking a key id and a KMS key.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 19, 20 and 26).
 */
import { describe, expect, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import { SignerConfig } from "#config/signer.config";
import { SIGNER_CONFIG_SCHEMA } from "#core/constants/signer-config-schema.constant";
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
});
