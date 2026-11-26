/**
 * Stackra file contract:
 * Purpose: `PrometheusSloRulesOptions`, how `prometheusSloRules` names the series it reads: the Prometheus name of the
 *          `http.server.request.duration` histogram and the label that carries the OpenTelemetry `service.name`.
 * Boundary: type only; every field is optional and defaults to what Prometheus's own OTLP receiver and the
 *           collector's Prometheus exporters write (underscores, the unit suffix, `job` from `service.name`).
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decisions 1 and 2).
 */

/** Naming overrides for a backend that translates OpenTelemetry names differently. */
export type PrometheusSloRulesOptions = {
  /** The histogram's base name; `_count` and `_bucket` are appended. Default `http_server_request_duration_seconds`. */
  readonly metric?: string;
  /** The label holding the service name. Default `job`. */
  readonly serviceLabel?: string;
  /** Where the runbook lives, linked from every alert. Default the Stackra docs page. */
  readonly runbookUrl?: string;
};
