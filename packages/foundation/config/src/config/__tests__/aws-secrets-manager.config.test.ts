/**
 * Stackra file contract:
 * Purpose: unit tests of `AwsSecretsManagerConfig`, its shape and `AWS_SECRETS_MANAGER_CONFIG_SCHEMA`: keyed
 *          `config.aws_secrets_manager`, built with the shipped defaults (equal to the initializers), taking a region,
 *          ids and a request timeout, and refusing an empty id or a timeout outside 100 to 60,000 ms.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 19, 20 and 26).
 */
import { describe, expect, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import { AwsSecretsManagerConfig } from "#config/aws-secrets-manager.config";
import { AWS_SECRETS_MANAGER_CONFIG_SCHEMA } from "#core/constants/aws-secrets-manager-config-schema.constant";
import { ConfigInvalidError } from "#core/errors/config-invalid.error";
import { buildConfig } from "#core/functions/build-config.function";
import { configKey } from "#core/functions/config-key.function";
import { AwsSecretsManagerOptions } from "#core/schemas/aws-secrets-manager-options.schema";

describe("AwsSecretsManagerConfig", () => {
  it("is keyed config.aws_secrets_manager with defaults equal to the initializers", () => {
    expect(configKey(AwsSecretsManagerConfig, "config")).toBe("config.aws_secrets_manager");
    expect(schemaOf(AwsSecretsManagerOptions)).toBe(AWS_SECRETS_MANAGER_CONFIG_SCHEMA);
    expect({ ...new AwsSecretsManagerOptions() }).toEqual(
      AWS_SECRETS_MANAGER_CONFIG_SCHEMA.parse({}),
    );
  });

  it("takes a region, ids and a timeout, and refuses an empty id or a timeout out of range", () => {
    const config = buildConfig(AwsSecretsManagerConfig, {
      values: { region: "me-central-1", secretIds: ["app/prod"], timeoutMs: 2000 },
    });
    expect(config.secretIds).toEqual(["app/prod"]);
    expect(config.timeoutMs).toBe(2000);
    expect(buildConfig(AwsSecretsManagerConfig, { values: {} }).timeoutMs).toBe(10_000);
    for (const timeoutMs of [50, 60_001, 1.5])
      expect(() => buildConfig(AwsSecretsManagerConfig, { values: { timeoutMs } })).toThrow(
        ConfigInvalidError,
      );
    expect(() => buildConfig(AwsSecretsManagerConfig, { values: { secretIds: [""] } })).toThrow(
      ConfigInvalidError,
    );
  });
});
