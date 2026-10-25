/**
 * Stackra file contract:
 * Purpose: `TelemetryConfig`, a client's telemetry configuration (key `logger.telemetry`): what an app or site
 *          reports about itself, its quality budgets and its Lighthouse run.
 * Boundary: a configuration class over `TelemetryOptions` with no env map: the DSN's variable differs per target
 *           (`VITE_`, `EXPO_PUBLIC_`), so the host feeds it from its own env configuration, and runway's
 *           `config.logger.telemetry` layer sets the rates per environment. Its presence in a host's module graph
 *           mounts the telemetry context; this package only declares the values.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0184 (telemetry); ADR 0183 (budgets); ADR 0232 (reporter
 *                     port).
 */
import { Config } from "@stackra/config";

import { TelemetryOptions } from "#core/schemas/telemetry-options.schema";

/**
 * A client's telemetry configuration.
 *
 * @example
 * import { TelemetryConfig as BaseTelemetryConfig } from "@stackra/logger";
 *
 * export class TelemetryConfig extends BaseTelemetryConfig {
 *   override errors = { ...new BaseTelemetryConfig().errors, enabled: true, sampleRate: 1 };
 *   override budgets = { ...new BaseTelemetryConfig().budgets, coldStartMs: 1500 };
 * }
 */
export class TelemetryConfig extends Config({ schema: TelemetryOptions }) {}
