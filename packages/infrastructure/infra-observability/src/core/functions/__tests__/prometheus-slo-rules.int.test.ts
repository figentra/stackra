/**
 * Stackra file contract:
 * Purpose: the proof of `prometheusSloRules` on a real Prometheus: `promtool test rules` loads the rule file the plan
 *          renders, replays five hours of request counters for three services and checks, at the four-hour mark, the
 *          complete list of firing `SloErrorBudgetBurn` alerts: a fast availability burn (20% errors against 99.9%)
 *          pages on both critical rows and tickets on both warning rows; a slow burn (0.4%) only tickets; a latency burn
 *          (10% slower than 500 ms against 99%) pages on the six-hour row and tickets; a healthy service (0.05% errors,
 *          0.1% slow) stays quiet; an objective whose service reports nothing raises only `SloIndicatorMissing`. It
 *          also checks the recorded ratios (rounded to 0.0001: `1 - x` carries float noise), an integer `le` bound
 *          written `1.0` included. A rule file with a broken
 *          threshold fails the same promtool test, so the test can fail. End to end, calls served through the server
 *          runtime's guarded path (`serveGuardedCall` with the OTLP metrics driver) reach a real collector and
 *          Prometheus's OTLP receiver as `http_server_request_duration_seconds`, the rendered rules record a 10% error
 *          ratio and a 10% slow ratio, the burn alerts fire on exactly the rows those ratios cross, and an objective
 *          whose service never reports is pending `SloIndicatorMissing`.
 * Boundary: integration tier (`.int`): needs Docker (`promtoolTestRules`, Testcontainers) or the Prometheus release
 *           folder (`STACKRA_PROMETHEUS_DIR`, the same pinned release); the end-to-end case also the collector binary
 *           (`STACKRA_OTELCOL_BIN`). Nothing is scraped: promtool's own unit-test series feed the rules, and the
 *           end-to-end metrics are pushed over OTLP.
 * Runtime: node (vitest)
 * Governing contract: ADR 0184 (decisions 1 to 3); ADR 0185 (decision 1); ADR 0182 (integration tier); the Google
 *                     SRE workbook's multi-window, multi-burn-rate alerts.
 */
import { setTimeout as sleep } from "node:timers/promises";

import { serveGuardedCall } from "@stackra/app/server";
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { ActorKind } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import { OtlpConfig, OtlpMetricsDriver } from "@stackra/logger";
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";

import { rootRunway } from "#core/__tests__/fixtures/runways.fixture";
import { promtoolTestRules } from "#core/__tests__/fixtures/promtool.fixture";
import { startSloStack } from "#core/__tests__/fixtures/slo-stack.fixture";
import type { SloStack } from "#core/__tests__/fixtures/slo-stack.fixture";
import { observabilityPlan } from "#core/functions/observability-plan.function";
import { prometheusSloRules } from "#core/functions/prometheus-slo-rules.function";
import type { PrometheusAlertingRule } from "#core/types/prometheus-alerting-rule.type";

/** checkout burns fast, search burns slowly (and its latency), billing is healthy, ledger reports nothing. */
const PLAN = observabilityPlan(
  rootRunway({
    providers: { betterstack: {} },
    observability: {
      slos: {
        objectives: [
          { service: "checkout", availability: 99.9 },
          { service: "search", availability: 99.9, latency: { thresholdMs: 500, percent: 99 } },
          { service: "billing", availability: 99.9, latency: { thresholdMs: 1000, percent: 99 } },
          { service: "ledger", availability: 99.9 },
        ],
      },
    },
  }),
  { apps: {}, services: ["checkout", "search", "billing", "ledger"] },
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

/** The no-data warning the rules expect for `service`: `absent()` keeps the selector's `job` label. */
function missing(service: string, kind: string) {
  const rule = RULES.groups
    .flatMap((group) => group.rules)
    .find(
      (candidate): candidate is PrometheusAlertingRule =>
        "alert" in candidate &&
        candidate.alert === "SloIndicatorMissing" &&
        candidate.labels["slo_service"] === service &&
        candidate.labels["slo"] === kind,
    );
  if (rule === undefined) throw new Error(`No ${service} ${kind} missing rule`);
  return { exp_labels: { ...rule.labels, job: service }, exp_annotations: rule.annotations };
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
        {
          eval_time: "4h",
          alertname: "SloIndicatorMissing",
          exp_alerts: [missing("ledger", "availability")],
        },
      ],
      promql_expr_test: [
        {
          expr: 'round(slo:sli_error:ratio_rate5m{slo_service="checkout",slo="availability"}, 0.0001)',
          eval_time: "4h",
          exp_samples: [
            {
              labels: '{slo="availability",slo_service="checkout"}',
              value: 0.2,
            },
          ],
        },
        {
          expr: 'round(slo:sli_error:ratio_rate1h{slo_service="search",slo="latency"}, 0.0001)',
          eval_time: "4h",
          exp_samples: [
            {
              labels: '{slo="latency",slo_service="search"}',
              value: 0.1,
            },
          ],
        },
        {
          expr: 'round(slo:sli_error:ratio_rate5m{slo_service="billing",slo="latency"}, 0.0001)',
          eval_time: "4h",
          exp_samples: [
            {
              labels: '{slo="latency",slo_service="billing"}',
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

  it("fails when a rule's threshold is wrong, so the proof above can fail", async () => {
    const broken = JSON.stringify(RULES, null, 2).replaceAll("> 0.0144", "> 0.5");
    const result = await promtoolTestRules(
      { "slo-rules.yml": broken, "slo-rules.test.yml": JSON.stringify(TESTS, null, 2) },
      "slo-rules.test.yml",
    );

    expect(result.exitCode).not.toBe(0);
    expect(result.output).toContain("FAILED");
  }, 300_000);
});

/** The served service burns both objectives; the silent one never reports. */
const STACK_PLAN = observabilityPlan(
  rootRunway({
    providers: { betterstack: {} },
    observability: {
      slos: {
        objectives: [
          {
            service: "proof-checkout",
            availability: 99.9,
            latency: { thresholdMs: 250, percent: 99 },
          },
          { service: "proof-silent", availability: 99.9 },
        ],
      },
    },
  }),
  { apps: {}, services: ["proof-checkout", "proof-silent"] },
);

/** No secret: the stack's collector takes OTLP without auth (the logger's own proof covers the auth). */
class NoSecrets extends SecretStore {
  get(): string | undefined {
    return undefined;
  }
}

/** The objective selector of the served service and `kind`. */
const selector = (kind: string): string => `{slo_service="proof-checkout",slo="${kind}"}`;

const CALLER: Actor = { kind: ActorKind.Service, id: "svc_01H2J3K4L5M6N7P8Q9R0S1T2U3" as never };

describe("the runtime's HTTP histogram through a collector into Prometheus and these rules", () => {
  let stack: SloStack;

  beforeAll(async () => {
    stack = await startSloStack(JSON.stringify(prometheusSloRules(STACK_PLAN), null, 2));
  }, 300_000);

  afterAll(async () => {
    await stack?.stop();
  });

  /** The value of `expr`'s one series, polled until it exists or 60 s pass. */
  async function valueOf(expr: string): Promise<number | undefined> {
    const deadline = Date.now() + 60_000;
    for (;;) {
      const [sample] = await stack.query(expr);
      if (sample !== undefined || Date.now() > deadline) return sample?.value;
      await sleep(500);
    }
  }

  it("records the error ratios of served calls, pages and tickets on them, and warns for a silent service", async () => {
    const metrics = new OtlpMetricsDriver(
      buildConfig(OtlpConfig, {
        values: {
          endpoint: stack.otlpEndpoint,
          serviceName: "proof-checkout",
          flushIntervalMs: 100,
        },
      }),
      new NoSecrets(),
    );
    /** One call through the server runtime's guarded path: fast, slow (300 ms, over the 250 ms threshold) or failing. */
    const serve = (outcome: "fast" | "slow" | "fail") =>
      serveGuardedCall({
        request: new Request("http://encore/orders/ord_1", {
          method: "POST",
          headers: { authorization: "Bearer t" },
          body: "{}",
        }),
        path: "/orders/:orderId",
        maxBodyBytes: 1024,
        anonymous: false,
        guard: async () => undefined,
        authenticate: async () => ({ actor: CALLER }),
        execute: async () => {
          if (outcome === "fail") throw new Error("database down");
          if (outcome === "slow") await sleep(300);
          return { ok: true };
        },
        metrics,
      });
    /** 20 calls: 16 fast, 2 slow, 2 failing (500): a 10% error ratio and a 10% slow ratio. */
    const round = () =>
      Promise.allSettled([
        ...Array.from({ length: 16 }, () => serve("fast")),
        serve("slow"),
        serve("slow"),
        serve("fail"),
        serve("fail"),
      ]);

    // Two exports of the cumulative histogram, so every window holds an increase.
    await round();
    await metrics.flush();
    await sleep(1500);
    await round();
    await metrics.flush();
    expect(metrics.dropped).toBe(0);

    expect(await valueOf(`slo:sli_error:ratio_rate5m${selector("availability")}`)).toBeCloseTo(
      0.1,
      3,
    );
    expect(await valueOf(`slo:sli_error:ratio_rate5m${selector("latency")}`)).toBeCloseTo(0.1, 3);

    // 10% errors burns a 99.9% budget past every row; 10% slow burns a 99% budget past all but the 1h row (14.4%).
    const rows = async (kind: string): Promise<string[]> =>
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts a fresh array; toSorted is ES2023 and the base lib is ES2022
      (
        await stack.query(
          `ALERTS{alertname="SloErrorBudgetBurn",alertstate="firing",slo_service="proof-checkout",slo="${kind}"}`,
        )
      )
        .map((sample) => `${sample.metric["severity"]} ${sample.metric["long_window"]}`)
        .sort();
    const expected = {
      availability: ["critical 1h", "critical 6h", "warning 1d", "warning 3d"],
      latency: ["critical 6h", "warning 1d", "warning 3d"],
    };
    const deadline = Date.now() + 30_000;
    let fired = { availability: await rows("availability"), latency: await rows("latency") };
    while (JSON.stringify(fired) !== JSON.stringify(expected) && Date.now() < deadline) {
      await sleep(500);
      fired = { availability: await rows("availability"), latency: await rows("latency") };
    }
    expect(fired).toEqual(expected);

    // The served service has data; the silent one is pending its 15 minutes of absence.
    const silent = await stack.query('ALERTS{alertname="SloIndicatorMissing"}');
    expect(
      silent.map((sample) => [sample.metric["slo_service"], sample.metric["alertstate"]]),
    ).toEqual([["proof-silent", "pending"]]);
  }, 300_000);
});
