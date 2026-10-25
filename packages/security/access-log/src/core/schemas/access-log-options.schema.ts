/**
 * Stackra file contract:
 * Purpose: `AccessLogOptions`, the shape of `AccessLogConfig`: which sink runs, and the retention the purge job
 *          enforces.
 * Boundary: a shape class; it registers this package's own schema (`ACCESS_LOG_CONFIG_SCHEMA`) for itself when the
 *           module loads, so `buildConfig(AccessLogConfig)` validates with no generated file. The sink is a
 *           `DriverName<AccessLogSink>` field, so a typo is a type error. Deploy-time values only, no secret.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 26); ADR 0146 as amended; ADR 0212 (decision 6: retention).
 */
import "#core/types/access-log-sink-driver-names.type";

import type { DriverName } from "@stackra/container";
import { Int, registerSchemas, Schema } from "@stackra/validation";

import type { AccessLogSink } from "#contracts/ports/access-log-sink.port";
import { ACCESS_LOG_CONFIG_SCHEMA } from "#core/constants/access-log-config-schema.constant";

/**
 * The access log's settings.
 *
 * @example
 * export class AccessLogConfig extends BaseAccessLogConfig {
 *   override retentionDays = 730;
 * }
 */
export class AccessLogOptions extends Schema {
  /** Which sink driver runs; the names are the driver file prefixes (`postgres`, `memory`). */
  sink: DriverName<AccessLogSink> = "postgres";

  /** Days a record is kept before `PurgeAccessLogAction` deletes it; at least 90. */
  @Int({ min: 90 })
  retentionDays = 400;
}

registerSchemas([[AccessLogOptions, ACCESS_LOG_CONFIG_SCHEMA]]);
