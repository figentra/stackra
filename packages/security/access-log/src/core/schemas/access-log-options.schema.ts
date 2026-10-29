/**
 * Stackra file contract:
 * Purpose: `AccessLogOptions`, the shape of `AccessLogConfig`: which sink runs, the retention the purge job
 *          enforces, the data classes that fail closed, the stated retention of the write audit, and where the audit
 *          export posts.
 * Boundary: a shape class; it registers this package's own schema (`ACCESS_LOG_CONFIG_SCHEMA`) for itself when the
 *           module loads, so `buildConfig(AccessLogConfig)` validates with no generated file. The sink is a
 *           `DriverName<AccessLogSink>` field, so a typo is a type error. Deploy-time values, and one secret by name
 *           (`ACCESS_LOG_EXPORT_TOKEN`, from the secret store). `auditRetentionDays` is unset until the owner states
 *           the policy (STA-1579): unset means the audit chain is kept without limit, and no job enforces it yet.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 26); ADR 0146 as amended; ADR 0212 (decision 6: retention); ADR
 *                     0409 (fail-closed classes; regulated added by STA-1300); ADR 0173 (secrets are names); STA-1579.
 */
import "#core/types/access-log-sink-driver-names.type";

import { Secret } from "@stackra/config";
import type { DriverName } from "@stackra/container";
import { DataClassification } from "@stackra/contracts";
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
  /** Days a record is kept before `PurgeAccessLogAction` deletes it; at least 90. */
  @Int({ min: 90 })
  retentionDays = 400;

  /**
   * Days the write audit (`audit_log_entries`) is stated to be kept. TODO(owner): unset until the owner picks the
   * policy; unset means kept without limit. Stated, not yet enforced: no job purges the audit chain.
   */
  @Int({ min: 1 })
  auditRetentionDays?: number;

  /** The bearer token the `https` audit export sink sends; empty until the secret is set. */
  @Secret("ACCESS_LOG_EXPORT_TOKEN")
  exportToken = "";

  /** Which sink driver runs; the names are the driver file prefixes (`postgres`, `memory`). */
  sink: DriverName<AccessLogSink> = "postgres";

  /**
   * The data classes whose read is refused when its access record cannot be written (fail closed); every other class
   * is served and the failure logged. A class marked `@AccessLogged({ failClosed: true })` (a privileged surface)
   * fails closed whatever its classification.
   */
  failClosed: DataClassification[] = [
    DataClassification.Financial,
    DataClassification.Health,
    DataClassification.Regulated,
  ];

  /** The HTTPS endpoint the `https` audit export sink posts NDJSON to; empty until runway sets it. */
  exportUrl = "";
}

registerSchemas([[AccessLogOptions, ACCESS_LOG_CONFIG_SCHEMA]]);
