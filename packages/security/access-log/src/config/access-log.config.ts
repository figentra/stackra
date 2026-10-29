/**
 * Stackra file contract:
 * Purpose: `AccessLogConfig`, the access log's configuration (key `access_log`): which sink runs, the retention the
 *          purge job enforces, the stated retention of the write audit (owner-set, STA-1579), and the audit export
 *          endpoint and token.
 * Boundary: a configuration class over `AccessLogOptions`; `env` maps the one field read from the environment to its
 *           variable, and runway's `config.access_log` layer sets values per environment. A host overrides it as
 *           `class AccessLogConfig extends BaseAccessLogConfig` with `override` members only; a custom sink class is a
 *           host `@Replaces(AccessLogSink)`, not a config value.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0296 (decision 1); ADR 0212 (decision
 *                     6); STA-1579.
 */
import { Config } from "@stackra/config";

import { AccessLogOptions } from "#core/schemas/access-log-options.schema";

/**
 * The access log's configuration, injected by type and validated once at boot.
 *
 * @example
 * import { AccessLogConfig as BaseAccessLogConfig } from "@stackra/access-log";
 *
 * export class AccessLogConfig extends BaseAccessLogConfig {
 *   override retentionDays = 730;
 * }
 */
export class AccessLogConfig extends Config({
  schema: AccessLogOptions,
  env: { sink: "STACKRA_ACCESS_LOG_SINK" },
}) {}
