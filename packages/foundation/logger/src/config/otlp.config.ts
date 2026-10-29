/**
 * Stackra file contract:
 * Purpose: `OtlpConfig`, the configuration of the OTLP log reporter, tracer and metrics drivers (key `logger.otlp`):
 *          the collector, the service name, the headers secret's name, the batching bounds, the trace sample ratio and
 *          the metric export interval.
 * Boundary: a configuration class over `OtlpOptions` with no env map; runway's `config.logger.otlp` layer sets it per
 *           environment, and the headers secret comes from the secret store. A host overrides it as
 *           `class OtlpConfig extends BaseOtlpConfig` with `override` members only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0184 (decision 2).
 */
import { Config } from "@stackra/config";

import { OtlpOptions } from "#core/schemas/otlp-options.schema";

/**
 * The OTLP drivers' configuration.
 *
 * @example
 * import { OtlpConfig as BaseOtlpConfig } from "@stackra/logger";
 *
 * export class OtlpConfig extends BaseOtlpConfig {
 *   override serviceName = "orders";
 * }
 */
export class OtlpConfig extends Config({ schema: OtlpOptions }) {}
