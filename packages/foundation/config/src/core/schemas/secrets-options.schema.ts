/**
 * Stackra file contract:
 * Purpose: `SecretsOptions`, the shape of `SecretsConfig`: which `SecretStore` driver reads the member's secrets.
 * Boundary: a shape class; it registers this package's own schema (`SECRETS_CONFIG_SCHEMA`) for itself when the
 *           module loads. A driver name only: the AWS driver's own settings are `AwsSecretsManagerConfig`.
 * Runtime: isomorphic
 * Governing contract: ADR 0173; ADR 0146 as amended; ADR 0294 (decisions 19 and 26).
 */
import "#core/types/secret-store-driver-names.type";

import type { DriverName } from "@stackra/container";
import { registerSchemas, Schema } from "@stackra/validation";

import type { SecretStore } from "#contracts/ports/secret-store.port";
import { SECRETS_CONFIG_SCHEMA } from "#core/constants/secrets-config-schema.constant";

/**
 * The secret store's settings.
 *
 * @example
 * export class SecretsConfig extends BaseSecretsConfig {
 *   override store = "aws_secrets_manager" as const;
 * }
 */
export class SecretsOptions extends Schema {
  /**
   * Which `SecretStore` driver runs: `memory` (values set in process, dev and tests; nothing selected one before, so
   * this keeps today's boots) or `aws_secrets_manager` (`AwsSecretsManagerConfig`), which a deployment selects.
   */
  store: DriverName<SecretStore> = "memory";
}

registerSchemas([[SecretsOptions, SECRETS_CONFIG_SCHEMA]]);
