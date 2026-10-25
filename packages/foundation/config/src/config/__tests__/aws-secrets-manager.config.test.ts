/**
 * Stackra file contract:
 * Purpose: unit tests of `AwsSecretsManagerConfig`, its shape and `AWS_SECRETS_MANAGER_CONFIG_SCHEMA`: keyed
 *          `config.aws_secrets_manager`, built with the shipped defaults (equal to the initializers), taking a region
 *          and ids, and refusing an empty id.
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

  it("takes a region and ids and refuses an empty id", () => {
    const config = buildConfig(AwsSecretsManagerConfig, {
      values: { region: "me-central-1", secretIds: ["app/prod"] },
    });
    expect(config.secretIds).toEqual(["app/prod"]);
    expect(() => buildConfig(AwsSecretsManagerConfig, { values: { secretIds: [""] } })).toThrow(
      ConfigInvalidError,
    );
  });
});
