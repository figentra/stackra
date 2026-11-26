/**
 * Stackra file contract:
 * Purpose: the proof of `prometheusSloRules` on a real Prometheus: `promtool test rules` loads the rule file the plan
 *          renders, replays five hours of request counters for three services and checks, at the four-hour mark, the
 *          complete list of firing `SloErrorBudgetBurn` alerts: a fast availability burn (20% errors against 99.9%)
 *          pages on both critical rows and tickets on both warning rows; a slow burn (0.4%) only tickets; a latency burn
 *          (10% slower than 500 ms against 99%) pages on the six-hour row and tickets; a healthy service (0.05% errors,
 *          0.1% slow) stays quiet. It also checks the recorded ratios, an integer `le` bound written `1.0` included.
 * Boundary: integration tier (`.int`): needs Docker (`promtoolTestRules`, Testcontainers). Nothing is scraped:
 *           promtool's own unit-test series feed the rules.
 * Runtime: node (vitest)
 * Governing contract: ADR 0184 (decisions 2 and 3); ADR 0185 (decision 1); ADR 0182 (integration tier); the Google
 *                     SRE workbook's multi-window, multi-burn-rate alerts.
 */
import { describe, expect, it } from "@stackra/testing";

import { rootRunway } from "#core/__tests__/fixtures/runways.fixture";
import { promtoolTestRules } from "#core/__tests__/fixtures/promtool.fixture";
import { observabilityPlan } from "#core/functions/observability-plan.function";
import { prometheusSloRules } from "#core/functions/prometheus-slo-rules.function";
import type { PrometheusAlertingRule } from "#core/types/prometheus-alerting-rule.type";

/** checkout burns fast, search burns slowly (and its latency), billing is healthy. */
const PLAN = observabilityPlan(
  rootRunway({
    providers: { betterstack: {} },
    observability: {
      slos: {
        objectives: [
          { service: "checkout", availability: 99.9 },
          { service: "search", availability: 99.9, latency: { thresholdMs: 500, percent: 99 } },
          { service: "billing", availability: 99.9, latency: { thresholdMs: 1000, percent: 99 } },
        ],
      },
    },
  }),
  { apps: {}, services: ["checkout", "search", "billing"] },
);

const RULES = prometheusSloRules(PLAN);

const HISTOGRAM = "http_server_request_duration_seconds";

/** A counter of `service` growing by `perMinute` for five hours, with `labels` beside `job`. */
function counter(
  series: string,
  service: string,
  perMinute: number,
  labels: Readonly<Record<string, string>> = {},
) {
  const all = Object.entries({ job: service, ...labels })
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join(",");
  return { series: `${series}{${all}}`, values: `0+${perMinute}x300` };
}

/** The alert the rules expect for `service`, `kind` and `longWindow`, with the annotations the rule file gives it. */
function firing(service: string, kind: string, longWindow: string) {
  const rule = RULES.groups
    .flatMap((group) => group.rules)
    .find(
      (candidate): candidate is PrometheusAlertingRule =>
        "alert" in candidate &&
        candidate.labels["slo_service"] === service &&
        candidate.labels["slo"] === kind &&
        candidate.labels["long_window"] === longWindow,
    );
  if (rule === undefined) throw new Error(`No ${service} ${kind} ${longWindow} rule`);
  return { exp_labels: rule.labels, exp_annotations: rule.annotations };
}

const TESTS = {
  rule_files: ["slo-rules.yml"],
  evaluation_interval: "1m",
  fuzzy_compare: true,
  tests: [
    {
      interval: "1m",
      input_series: [
        counter(`${HISTOGRAM}_count`, "checkout", 800, { http_response_status_code: "200" }),
        counter(`${HISTOGRAM}_count`, "checkout", 200, { http_response_status_code: "503" }),
        counter(`${HISTOGRAM}_count`, "search", 996, { http_response_status_code: "200" }),
        counter(`${HISTOGRAM}_count`, "search", 4, { http_response_status_code: "500" }),
        counter(`${HISTOGRAM}_bucket`, "search", 900, { le: "0.5" }),
        counter(`${HISTOGRAM}_count`, "billing", 9995, { http_response_status_code: "200" }),
        counter(`${HISTOGRAM}_count`, "billing", 5, { http_response_status_code: "502" }),
        counter(`${HISTOGRAM}_bucket`, "billing", 9990, { le: "1.0" }),
      ],
      alert_rule_test: [
        {
          eval_time: "4h",
          alertname: "SloErrorBudgetBurn",
          exp_alerts: [
            firing("checkout", "availability", "1h"),
            firing("checkout", "availability", "6h"),
            firing("checkout", "availability", "1d"),
            firing("checkout", "availability", "3d"),
            firing("search", "availability", "1d"),
            firing("search", "availability", "3d"),
            firing("search", "latency", "6h"),
            firing("search", "latency", "1d"),
            firing("search", "latency", "3d"),
          ],
        },
      ],
      promql_expr_test: [
        {
          expr: 'slo:sli_error:ratio_rate5m{slo_service="checkout",slo="availability"}',
          eval_time: "4h",
          exp_samples: [
            {
              labels: 'slo:sli_error:ratio_rate5m{slo="availability",slo_service="checkout"}',
              value: 0.2,
            },
          ],
        },
        {
          expr: 'slo:sli_error:ratio_rate1h{slo_service="search",slo="latency"}',
          eval_time: "4h",
          exp_samples: [
            {
              labels: 'slo:sli_error:ratio_rate1h{slo="latency",slo_service="search"}',
              value: 0.1,
            },
          ],
        },
        {
          expr: 'slo:sli_error:ratio_rate5m{slo_service="billing",slo="latency"}',
          eval_time: "4h",
          exp_samples: [
            {
              labels: 'slo:sli_error:ratio_rate5m{slo="latency",slo_service="billing"}',
              value: 0.001,
            },
          ],
        },
      ],
    },
  ],
};

describe("prometheusSloRules on a real Prometheus", () => {
  it("pages on a fast burn, tickets on a slow one and keeps a healthy service quiet", async () => {
    const result = await promtoolTestRules(
      {
        "slo-rules.yml": JSON.stringify(RULES, null, 2),
        "slo-rules.test.yml": JSON.stringify(TESTS, null, 2),
      },
      "slo-rules.test.yml",
    );

    expect(result.output).toContain("SUCCESS");
    expect(result.exitCode).toBe(0);
  }, 300_000);
});
