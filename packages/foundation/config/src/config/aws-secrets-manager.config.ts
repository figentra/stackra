/**
 * Stackra file contract:
 * Purpose: `AwsSecretsManagerConfig`, the configuration of the AWS Secrets Manager secret store (key
 *          `config.aws_secrets_manager`): the region and the secret ids read at load.
 * Boundary: a configuration class over `AwsSecretsManagerOptions` with no env map; runway's layer sets it per
 *           environment. No credential: the runtime's AWS role signs the reads.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0173.
 */
import { Config } from "#core/bases/config.base";
import { AwsSecretsManagerOptions } from "#core/schemas/aws-secrets-manager-options.schema";

/**
 * The AWS Secrets Manager store's configuration.
 *
 * @example
 * const config = buildConfig(AwsSecretsManagerConfig, { values: { region: "me-central-1", secretIds: ["app/prod"] } });
 */
export class AwsSecretsManagerConfig extends Config({ schema: AwsSecretsManagerOptions }) {}
