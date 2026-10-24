/**
 * Stackra file contract:
 * Purpose: `LoggingConfig`, the logger's configuration (key `logger.logging`): levels, per-channel levels, sampling
 *          and the extra redacted fields `ChannelLoggerDriver` reads.
 * Boundary: a configuration class over `LoggingOptions` with no env map; runway's `config.logger.logging` layer sets it
 *           per environment. A host overrides it as `class LoggingConfig extends BaseLoggingConfig` with `override`
 *           members only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0147 (decision 1).
 */
import { Config } from "@stackra/config";

import { LoggingOptions } from "#core/schemas/logging-options.schema";

/**
 * The logger's configuration.
 *
 * @example
 * import { LoggingConfig as BaseLoggingConfig } from "@stackra/logger";
 *
 * export class LoggingConfig extends BaseLoggingConfig {
 *   override redaction = { ...new BaseLoggingConfig().redaction, extraFields: ["customerId", "paymentId"] };
 * }
 */
export class LoggingConfig extends Config({ schema: LoggingOptions }) {}
