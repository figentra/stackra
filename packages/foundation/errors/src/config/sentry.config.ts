/**
 * Stackra file contract:
 * Purpose: `SentryConfig`, the configuration of the Sentry error reporter (key `errors.sentry`): which secret holds the
 *          DSN, the environment and release tags, and the sampling rate.
 * Boundary: a configuration class over `SentryOptions` with no env map; runway's `config.errors.sentry` layer sets it
 *           per environment, and the DSN secret comes from the secret store. A host overrides it as
 *           `class SentryConfig extends BaseSentryConfig` with `override` members only. The one Sentry source: logger's
 *           `TelemetryConfig` defers to it for the DSN and the error sampling (ADR 0465).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0184 (decision 6); ADR 0465.
 */
import { Config } from "@stackra/config";

import { SentryOptions } from "#core/schemas/sentry-options.schema";

/**
 * The Sentry reporter's configuration.
 *
 * @example
 * import { SentryConfig as BaseSentryConfig } from "@stackra/errors";
 *
 * export class SentryConfig extends BaseSentryConfig {
 *   override environment = "staging";
 * }
 */
export class SentryConfig extends Config({ schema: SentryOptions }) {}
