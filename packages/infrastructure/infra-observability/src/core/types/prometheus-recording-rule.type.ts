/**
 * Stackra file contract:
 * Purpose: `PrometheusRecordingRule`, one recording rule of a Prometheus rule file: `expr` evaluated and stored as the
 *          series `record` with `labels`.
 * Boundary: type only; `prometheusSloRules` returns it inside a `PrometheusRuleFile`.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 2: the optional LGTM stack); the Prometheus rule file format.
 */

/** A recording rule. */
export type PrometheusRecordingRule = {
  /** The name of the series it stores (`slo:sli_error:ratio_rate5m`). */
  readonly record: string;
  /** The PromQL expression evaluated each interval. */
  readonly expr: string;
  /** Labels added to the stored series. */
  readonly labels: Readonly<Record<string, string>>;
};
