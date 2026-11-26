/**
 * Stackra file contract:
 * Purpose: unit tests of `prometheusSloRules`: a plan without objectives gives an empty rule file; each objective gets
 *          one group with a recording rule per distinct window (the availability ratio counts 5xx answers, the latency
 *          ratio the requests above the threshold bucket, an integer bound matching `1` and `1.0`) and one
 *          `SloErrorBudgetBurn` alert per burn-rate row, both windows above the threshold, with its severity, windows
 *          and runbook, and one `SloIndicatorMissing` warning per objective over the exact series it reads; the
 *          series names, the service label and the runbook link can be overridden.
 * Boundary: test only; pure function. `prometheus-slo-rules.int.test.ts` proves the rules on a real Prometheus.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0184 (decisions 2 and 3); ADR 0185 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { rootRunway } from "#core/__tests__/fixtures/runways.fixture";
import { observabilityPlan } from "#core/functions/observability-plan.function";
import { prometheusSloRules } from "#core/functions/prometheus-slo-rules.function";
import type { PrometheusAlertingRule } from "#core/types/prometheus-alerting-rule.type";
import type { PrometheusRecordingRule } from "#core/types/prometheus-recording-rule.type";

/** The plan of `objectives` over the services `orders` and `search`. */
function planOf(objectives: readonly Record<string, unknown>[]) {
  return observabilityPlan(
    rootRunway({
      providers: { betterstack: {} },
      observability: { slos: { objectives } },
    }),
    {
      apps: {},
      services: ["orders", "search"],
    },
  );
}

const isRecording = (rule: object): rule is PrometheusRecordingRule => "record" in rule;
const isAlerting = (rule: object): rule is PrometheusAlertingRule =>
  "alert" in rule && rule.alert === "SloErrorBudgetBurn";
const isMissing = (rule: object): rule is PrometheusAlertingRule =>
  "alert" in rule && rule.alert === "SloIndicatorMissing";

describe("prometheusSloRules", () => {
  it("gives an empty rule file without objectives", () => {
    expect(prometheusSloRules(planOf([]))).toEqual({ groups: [] });
  });

  it("records the availability error ratio per window and alerts on each burn-rate row", () => {
    const [group, ...rest] = prometheusSloRules(
      planOf([{ service: "orders", availability: 99.9 }]),
    ).groups;
    expect(rest).toEqual([]);
    expect(group?.name).toBe("slo-orders-availability");

    const recording = group?.rules.filter(isRecording) ?? [];
    expect(recording.map((rule) => rule.record)).toEqual([
      "slo:sli_error:ratio_rate5m",
      "slo:sli_error:ratio_rate1h",
      "slo:sli_error:ratio_rate30m",
      "slo:sli_error:ratio_rate6h",
      "slo:sli_error:ratio_rate2h",
      "slo:sli_error:ratio_rate1d",
      "slo:sli_error:ratio_rate3d",
    ]);
    expect(recording[0]).toEqual({
      record: "slo:sli_error:ratio_rate5m",
      expr:
        '(sum(rate(http_server_request_duration_seconds_count{job="orders",http_response_status_code=~"5.."}[5m])) or vector(0))' +
        ' / sum(rate(http_server_request_duration_seconds_count{job="orders"}[5m]))',
      labels: { slo_service: "orders", slo: "availability" },
    });

    const alerting = group?.rules.filter(isAlerting) ?? [];
    expect(alerting.map((rule) => [rule.labels["severity"], rule.labels["long_window"]])).toEqual([
      ["critical", "1h"],
      ["critical", "6h"],
      ["warning", "1d"],
      ["warning", "3d"],
    ]);
    expect(alerting[0]).toEqual({
      alert: "SloErrorBudgetBurn",
      expr:
        'slo:sli_error:ratio_rate1h{slo_service="orders",slo="availability"} > 0.0144' +
        ' and slo:sli_error:ratio_rate5m{slo_service="orders",slo="availability"} > 0.0144',
      labels: {
        slo_service: "orders",
        slo: "availability",
        severity: "critical",
        long_window: "1h",
        short_window: "5m",
      },
      annotations: {
        summary:
          "orders availability burns its error budget 14.4x faster than its 30-day objective allows",
        description: "At this rate 2% of the 30-day error budget (target 99.9%) is spent in 1h.",
        runbook_url: "https://docs.stackra.figentra.com/runbooks/slo-burn-rate",
      },
    });
    expect(alerting[3]?.expr).toBe(
      'slo:sli_error:ratio_rate3d{slo_service="orders",slo="availability"} > 0.001' +
        ' and slo:sli_error:ratio_rate6h{slo_service="orders",slo="availability"} > 0.001',
    );
  });

  it("warns when an objective's series is missing, so a silent objective is never mistaken for a healthy one", () => {
    const groups = prometheusSloRules(
      planOf([
        { service: "orders", availability: 99.9 },
        { service: "search", latency: { thresholdMs: 1000, percent: 95 } },
      ]),
    ).groups;
    const [availability, latency] = groups.map((group) => group.rules.filter(isMissing));
    expect(availability).toEqual([
      {
        alert: "SloIndicatorMissing",
        expr: 'absent(http_server_request_duration_seconds_count{job="orders"})',
        for: "15m",
        labels: { slo_service: "orders", slo: "availability", severity: "warning" },
        annotations: {
          summary: "orders availability has no data, so its burn-rate alerts cannot fire",
          description: expect.stringContaining("http.server.request.duration in seconds"),
          runbook_url: "https://docs.stackra.figentra.com/runbooks/slo-burn-rate#no-data",
        },
      },
    ]);
    // A latency objective reads its threshold bucket: a histogram bucketed in milliseconds has none, and warns.
    expect(latency?.[0]?.expr).toBe(
      'absent(http_server_request_duration_seconds_bucket{job="search",le=~`1(\\.0)?`})',
    );
  });

  it("records the latency error ratio from the threshold bucket, an integer bound matching 1 and 1.0", () => {
    const groups = prometheusSloRules(
      planOf([
        { service: "orders", latency: { thresholdMs: 250, percent: 99 } },
        { service: "search", latency: { thresholdMs: 1000, percent: 95 } },
      ]),
    ).groups;

    expect(groups.map((group) => group.name)).toEqual(["slo-orders-latency", "slo-search-latency"]);
    expect(groups[0]?.rules.find(isRecording)?.expr).toBe(
      '1 - (sum(rate(http_server_request_duration_seconds_bucket{job="orders",le=~`0\\.25`}[5m]))' +
        ' / sum(rate(http_server_request_duration_seconds_count{job="orders"}[5m])))',
    );
    expect(groups[1]?.rules.find(isRecording)?.expr).toContain("le=~`1(\\.0)?`");
    expect(groups[1]?.rules.find(isAlerting)?.expr).toContain("> 0.72");
  });

  it("takes another histogram name, service label and runbook", () => {
    const [group] = prometheusSloRules(planOf([{ service: "orders", availability: 99 }]), {
      metric: "http_server_request_duration",
      serviceLabel: "service_name",
      runbookUrl: "https://runbooks.acme.example/slo",
    }).groups;

    expect(group?.rules.find(isRecording)?.expr).toBe(
      '(sum(rate(http_server_request_duration_count{service_name="orders",http_response_status_code=~"5.."}[5m])) or vector(0))' +
        ' / sum(rate(http_server_request_duration_count{service_name="orders"}[5m]))',
    );
    expect(group?.rules.find(isAlerting)?.annotations["runbook_url"]).toBe(
      "https://runbooks.acme.example/slo",
    );
  });
});
