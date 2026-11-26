/**
 * Stackra file contract:
 * Purpose: `prometheusSloRules(plan, options)`, the plan's objectives and burn-rate alerts as a Prometheus rule file
 *          for the on-premises LGTM stack (Mimir or Prometheus, ADR 0184 decision 2): per objective, one recording rule
 *          per window holding its error ratio (availability: the share of requests answered 5xx; latency: the share
 *          slower than the threshold bucket), and one `SloErrorBudgetBurn` alerting rule per burn-rate row that fires
 *          while both its windows are above the threshold. Every alert carries `severity` (critical pages, warning
 *          opens a ticket), the service, the indicator and both windows, and links the runbook.
 * Boundary: pure: plan in, data out; reads no file and calls nothing. The caller serialises it (`JSON.stringify` is a
 *           valid rule file) and loads it into the ruler. Series names follow the OpenTelemetry-to-Prometheus
 *           translation of Prometheus's OTLP receiver and the collector's Prometheus exporters, overridable in
 *           `options`. A plan with no objectives gives an empty file.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decisions 2 and 3); ADR 0185 (decision 1: critical pages on-call); the Google SRE
 *                     workbook's multi-window, multi-burn-rate alerts.
 */
import { SliKind } from "#core/enums/sli-kind.enum";
import type { ObservabilityPlan } from "#core/types/observability-plan.type";
import type { PrometheusAlertingRule } from "#core/types/prometheus-alerting-rule.type";
import type { PrometheusRecordingRule } from "#core/types/prometheus-recording-rule.type";
import type { PrometheusRuleFile } from "#core/types/prometheus-rule-file.type";
import type { PrometheusSloRulesOptions } from "#core/types/prometheus-slo-rules-options.type";
import type { SloObjective } from "#core/types/slo-objective.type";

/** The runbook every burn alert links. */
const RUNBOOK = "https://docs.stackra.figentra.com/runbooks/slo-burn-rate";

/** The name of every burn alert; the labels tell them apart. */
const ALERT = "SloErrorBudgetBurn";

/** The recording rule of the error ratio over `window`. */
const ratioOf = (window: string): string => `slo:sli_error:ratio_rate${window}`;

/** A PromQL raw-string regex matching the `le` label of `bound`, written `0.5`, `1` or `1.0` by the backend. */
function leMatcher(bound: number): string {
  const text = String(bound).replace(".", "\\.");
  return Number.isInteger(bound) ? `\`${text}(\\.0)?\`` : `\`${text}\``;
}

/** The error-ratio expression of `objective` over `window`. */
function errorRatio(
  objective: SloObjective,
  window: string,
  metric: string,
  serviceLabel: string,
): string {
  const service = `${serviceLabel}=${JSON.stringify(objective.service)}`;
  const all = `sum(rate(${metric}_count{${service}}[${window}]))`;
  if (objective.kind === SliKind.Availability)
    return `(sum(rate(${metric}_count{${service},http_response_status_code=~"5.."}[${window}])) or vector(0)) / ${all}`;
  const fast = `sum(rate(${metric}_bucket{${service},le=~${leMatcher(objective.thresholdSeconds ?? 0)}}[${window}]))`;
  return `1 - (${fast} / ${all})`;
}

/** `value` as a PromQL number, without float noise (`0.0144`, never `0.014400000000000001`). */
const num = (value: number): string => String(Number(value.toPrecision(12)));

/**
 * The plan's objectives as Prometheus recording and alerting rules.
 *
 * @param plan - the telemetry plan; only `slos` is read.
 * @param options - the histogram's Prometheus name, the service label and the runbook link.
 * @example
 * const rules = prometheusSloRules(observabilityPlan(root, members));
 * writeFileSync("slo-rules.yml", JSON.stringify(rules, null, 2));
 */
export function prometheusSloRules(
  plan: Pick<ObservabilityPlan, "slos">,
  options: PrometheusSloRulesOptions = {},
): PrometheusRuleFile {
  const metric = options.metric ?? "http_server_request_duration_seconds";
  const serviceLabel = options.serviceLabel ?? "job";
  const runbook = options.runbookUrl ?? RUNBOOK;
  const { windowDays } = plan.slos;

  return {
    groups: plan.slos.objectives.map((objective) => {
      const alerts = plan.slos.burnRateAlerts.filter(
        (alert) => alert.service === objective.service && alert.kind === objective.kind,
      );
      const windows = [
        ...new Set(alerts.flatMap((alert) => [alert.shortWindow, alert.longWindow])),
      ];
      const labels = { slo_service: objective.service, slo: objective.kind };
      const selector = `{slo_service=${JSON.stringify(objective.service)},slo=${JSON.stringify(objective.kind)}}`;
      const recording = windows.map((window): PrometheusRecordingRule => ({
        record: ratioOf(window),
        expr: errorRatio(objective, window, metric, serviceLabel),
        labels,
      }));
      const alerting = alerts.map((alert): PrometheusAlertingRule => ({
        alert: ALERT,
        expr: `${ratioOf(alert.longWindow)}${selector} > ${num(alert.threshold)} and ${ratioOf(alert.shortWindow)}${selector} > ${num(alert.threshold)}`,
        labels: {
          ...labels,
          severity: alert.severity,
          long_window: alert.longWindow,
          short_window: alert.shortWindow,
        },
        annotations: {
          summary: `${objective.service} ${objective.kind} burns its error budget ${num(alert.burnRate)}x faster than its ${windowDays}-day objective allows`,
          description: `At this rate ${num(alert.budgetSpent * 100)}% of the ${windowDays}-day error budget (target ${num(objective.target * 100)}%) is spent in ${alert.longWindow}.`,
          runbook_url: runbook,
        },
      }));
      return {
        name: `slo-${objective.service}-${objective.kind}`,
        rules: [...recording, ...alerting],
      };
    }),
  };
}
