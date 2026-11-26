/**
 * Stackra file contract:
 * Purpose: `PrometheusRuleFile`, a Prometheus rule file as data: groups of recording rules (`record`) and alerting
 *          rules (`alert`), the shape Prometheus, Mimir and Grafana load. JSON is YAML, so `JSON.stringify` of it is a
 *          valid rule file.
 * Boundary: type only; `prometheusSloRules` returns it.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 2: the optional LGTM stack); the Prometheus rule file format.
 */
import type { PrometheusAlertingRule } from "#core/types/prometheus-alerting-rule.type";
import type { PrometheusRecordingRule } from "#core/types/prometheus-recording-rule.type";

/** A rule file. */
export type PrometheusRuleFile = {
  /** The rule groups; each is evaluated in order, recording rules before the alerts that read them. */
  readonly groups: readonly {
    readonly name: string;
    readonly rules: readonly (PrometheusRecordingRule | PrometheusAlertingRule)[];
  }[];
};
