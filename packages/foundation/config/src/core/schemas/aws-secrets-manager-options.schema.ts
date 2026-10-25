/**
 * Stackra file contract:
 * Purpose: `AwsSecretsManagerOptions`, the shape of `AwsSecretsManagerConfig`: the AWS region and the secrets the
 *          `aws-secrets-manager` store reads at load.
 * Boundary: a shape class; it registers this package's own schema (`AWS_SECRETS_MANAGER_CONFIG_SCHEMA`) for itself
 *           when the module loads. No credential: the driver uses the runtime's AWS credential chain (the task or
 *           instance role), so no key is configured anywhere. Which secrets a deployment reads is data (runway), never
 *           code.
 * Runtime: isomorphic
 * Governing contract: ADR 0173 (secrets by name); ADR 0146 as amended; ADR 0294 (decisions 19 and 26).
 */
import { registerSchemas, Schema } from "@stackra/validation";

import { AWS_SECRETS_MANAGER_CONFIG_SCHEMA } from "#core/constants/aws-secrets-manager-config-schema.constant";

/**
 * The AWS Secrets Manager store's settings.
 *
 * @example
 * export class AwsSecretsManagerConfig extends BaseAwsSecretsManagerConfig {
 *   override region = "me-central-1";
 *   override secretIds = ["commerce/prod/app"];
 * }
 */
export class AwsSecretsManagerOptions extends Schema {
  /** The region the secrets live in (`me-central-1`); the store refuses to load while it is empty. */
  region = "";

  /**
   * The secret ids or ARNs read at load. A secret whose value is a JSON object gives one secret per string member
   * (`{ "RESEND_API_KEY": "…" }`); any other value is one secret under the secret's name.
   */
  secretIds: string[] = [];
}

registerSchemas([[AwsSecretsManagerOptions, AWS_SECRETS_MANAGER_CONFIG_SCHEMA]]);
