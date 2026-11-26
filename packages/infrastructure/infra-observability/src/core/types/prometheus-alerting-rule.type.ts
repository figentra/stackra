/**
 * Stackra file contract:
 * Purpose: `PrometheusAlertingRule`, one alerting rule of a Prometheus rule file: it fires while `expr` returns a
 *          series, with `labels` added to the alert and `annotations` describing it.
 * Boundary: type only; `prometheusSloRules` returns it inside a `PrometheusRuleFile`.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 2: the optional LGTM stack); the Prometheus rule file format.
 */

/** An alerting rule. */
export type PrometheusAlertingRule = {
  /** The alert's name (`SloErrorBudgetBurn`); the labels tell its instances apart. */
  readonly alert: string;
  /** The PromQL expression; the alert fires while it returns a series. */
  readonly expr: string;
  /** Labels added to the alert, which route it (`severity`). */
  readonly labels: Readonly<Record<string, string>>;
  /** Text about the alert: `summary`, `description`, `runbook_url`. */
  readonly annotations: Readonly<Record<string, string>>;
};
