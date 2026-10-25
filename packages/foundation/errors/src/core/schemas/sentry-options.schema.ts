/**
 * Stackra file contract:
 * Purpose: `SentryOptions`, the shape of `SentryConfig`: the name of the secret that holds the DSN, the environment and
 *          release every report is tagged with, and the share of errors reported.
 * Boundary: a shape class; it registers this package's own schema (`SENTRY_CONFIG_SCHEMA`) for itself when the module
 *           loads. The DSN is a secret by name (`dsnSecret`), read through the `SecretStore` port by the driver, never
 *           a value here. The defaults report nothing until the secret is set.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 6: Sentry handles crash reports); ADR 0173 (secrets by name); ADR 0294
 *                     (decisions 19 and 26).
 */
import { registerSchemas, Schema } from "@stackra/validation";

import { SENTRY_CONFIG_SCHEMA } from "#core/constants/sentry-config-schema.constant";

/**
 * The Sentry reporter's settings.
 *
 * @example
 * export class SentryConfig extends BaseSentryConfig {
 *   override environment = "production";
 *   override sampleRate = 0.5;
 * }
 */
export class SentryOptions extends Schema {
  /** The SCREAMING_SNAKE name of the secret holding the DSN; reporting is off while the store has no value for it. */
  dsnSecret = "SENTRY_DSN";

  /** The environment each report is tagged with (`production`); none when empty. */
  environment = "";

  /** The release each report is tagged with (a version or a commit); none when empty. */
  release = "";

  /** The share of errors reported, 0 to 1. */
  sampleRate = 1;
}

registerSchemas([[SentryOptions, SENTRY_CONFIG_SCHEMA]]);
