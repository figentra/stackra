# Implementation Plan: OTLP proven against a real collector, and SLO burn-rate alerts

**Spec**: `.agents/specs/sta-2854-otlp-collector-proof-slo-burn-rate/spec.md` · **Linear**: STA-2854 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2854-otlp-collector-proof-slo-burn-rate/spec.md`

## Summary

The logger gains an integration tier that runs its three OTLP drivers against the pinned OpenTelemetry Collector
contrib image in Testcontainers. The runway's `observability.slos` block gains a window and per-service objectives;
`observabilityPlan` turns each objective into the four multi-window, multi-burn-rate alerts of the SRE workbook, and
`prometheusSloRules` renders them as a Prometheus rule file for the LGTM stack, proven with `promtool test rules` on the
pinned Prometheus image. A runbook says what to do when the alert fires.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/foundation/logger`, `packages/infrastructure/infra-observability`, `packages/developer/runway`,
  `apps/docs`
- **Testing**: vitest unit tests in `src/**/__tests__/`; `.int.test.ts` files under each package's `test:int`
  (Docker, Testcontainers): `otel/opentelemetry-collector-contrib:0.165.0` and `prom/prometheus:v3.15.1`
- **Storage**: none
- **Runtime target**: the plan and the rules are isomorphic and pure; the rule file is loaded by Mimir or Prometheus

## Constitution Check

| Law                                   | Result | Note                                                                        |
| ------------------------------------- | ------ | --------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | no new import direction; runway mirrors the keys, as its file contract says |
| Secrets (ADR 0009)                    | PASS   | none; the test password is random per run and never written                 |
| Security                              | PASS   | no route or auth change                                                     |
| HTTP and events                       | N/A    | no route, header or event shape changes                                     |
| Tenancy                               | N/A    | no tenant data                                                              |
| Delegation                            | PASS   | Claude only                                                                 |
| Not built yet (ADR 0011)              | N/A    | none                                                                        |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`; integration tier infixed `.int`                      |
| Versions and catalogs                 | PASS   | `testcontainers` from the catalog; minor changesets, a patch for logger     |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                                           |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                                   |
| Docs and ADRs                         | PASS   | runbook, both READMEs, the runway schema; ADR 0184 unchanged                |

## Deploy modes

| Mode       | Behaviour                                                                        |
| ---------- | -------------------------------------------------------------------------------- |
| SaaS       | the plan carries the objectives; the LGTM stack's ruler loads the rendered rules |
| On-prem    | same; the rules need only Prometheus or Mimir and the OTLP-translated histogram  |
| Air-gapped | same; nothing calls out, the rule file is plain data                             |

## Correctness properties

- **P-001**: each signal the drivers send is re-exported by a real collector with its resource and data intact —
  Validates: AC-001
- **P-002**: a refused batch is counted in `dropped` and never exported — Validates: AC-002
- **P-003**: the runway refuses an empty, out-of-range or misspelt objective, and the derived JSON schema equals the
  canonical file — Validates: AC-003
- **P-004**: the burn rates are `budgetSpent × windowHours / longHours` and the thresholds `burnRate × (1 − target)`,
  free of float noise — Validates: AC-004
- **P-005**: every refusal names its path, all at once — Validates: AC-005
- **P-006**: no objective in the runway gives empty `objectives` and `burnRateAlerts` and an empty rule file —
  Validates: AC-006, AC-007
- **P-007**: the complete list of firing alerts at a point in a replayed series is exactly the rows over threshold —
  Validates: AC-008

## Architecture overview

1. `OBSERVABILITY_SCHEMA` (infra-observability) and `OBSERVABILITY_SECTION_SCHEMA` (runway) accept `slos.windowDays`
   (default 30 in infra-observability) and `slos.objectives`.
2. `observabilityPlan` checks each objective (member, duplicate, bucket bound against `HTTP_SERVER_DURATION.bounds` of
   `@stackra/contracts`), maps it to one `SloObjective` per indicator, and multiplies each by the four
   `BURN_RATE_WINDOWS` rows into `BurnRateAlert`s, a burn rate never below 1.
3. `prometheusSloRules(plan, options)` reads `plan.slos` only: per objective a group `slo-<service>-<kind>` with the
   recording rules `slo:sli_error:ratio_rate<window>{slo_service, slo}` (availability: 5xx count rate over all; latency:
   one minus the threshold bucket's rate over all) and the `SloErrorBudgetBurn` alerts
   (`long > threshold and short > threshold`), plus one `SloIndicatorMissing` (`absent(<series>)` for 15m).
4. `observabilityStack` passes `plan.slos` through to its outputs.
5. The series: `serveGuardedCall` (`@stackra/app/server`) records every answered call in `http.server.request.duration`
   (seconds, `HTTP_SERVER_DURATION`'s bounds and unit as `HistogramOptions`) through the bound `Metrics`, which the
   generated HTTP adapter hands it; `OtlpMetricsDriver` buckets by the advised bounds and writes the unit, so Prometheus
   names it `http_server_request_duration_seconds` with the service in `job`.

## Components and responsibilities

- `BURN_RATE_WINDOWS`: the four SRE-workbook rows (budget share, long and short window, severity).
- `HTTP_SERVER_DURATION` (`@stackra/contracts`): the name, unit and advised bounds of `http.server.request.duration`.
- `HistogramOptions` (`@stackra/contracts`): a histogram recording's advised unit and bounds.
- `SloObjective`, `BurnRateAlert`, `BurnRateWindow`: plan data.
- `PrometheusRuleFile`, `PrometheusRecordingRule`, `PrometheusAlertingRule`, `PrometheusSloRulesOptions`: the rendered
  file and its naming overrides (`metric`, `serviceLabel`, `runbookUrl`).
- `startCollector()` (logger test fixture): the collector with a basic-auth OTLP/HTTP receiver and a JSON-lines file
  exporter read back out of the container.
- `promtoolTestRules()` (infra-observability test fixture): copies the rules and the test file into a Prometheus
  container (or a folder, with the release binary) and runs `promtool test rules`.
- `startSloStack()` (infra-observability test fixture): a collector forwarding OTLP metrics to Prometheus's OTLP
  receiver, which evaluates the rules every second; images on one network, or the release binaries.

## Files and folders

```text
packages/foundation/contracts/
  README.md
  src/core/index.ts
  src/core/constants/http-server-duration.constant.ts
  src/core/constants/__tests__/http-server-duration.constant.test.ts
  src/core/types/histogram-options.type.ts
  src/core/ports/metrics.port.ts
  src/core/ports/__tests__/metrics.port.test.ts
  src/core/drivers/noop-metrics.driver.ts
  src/core/__tests__/index.test.ts
packages/runtime/app/
  README.md
  src/server/functions/serve-guarded-call.function.ts
  src/server/types/guarded-call-options.type.ts
  src/server/functions/__tests__/serve-guarded-call.function.test.ts
packages/developer/gen/
  src/core/functions/emit-encore-http.function.ts
  src/core/functions/__tests__/emit-encore-http.function.test.ts
  __golden__/*/expected/services/*/stackra-encore/*/http.ts.golden
packages/foundation/logger/
  README.md
  src/core/drivers/otlp-metrics.driver.ts
  src/core/drivers/__tests__/otlp-metrics.driver.test.ts
  src/core/functions/otlp-metrics-body.function.ts
  src/core/types/metric-point.type.ts
  package.json
  vitest.int.config.ts
  src/core/drivers/__tests__/otlp-collector.int.test.ts
  src/core/drivers/__tests__/fixtures/otel-collector.fixture.ts
packages/infrastructure/infra-observability/
  README.md
  package.json
  vitest.int.config.ts
  src/core/constants/burn-rate-windows.constant.ts
  src/core/constants/observability-schema.constant.ts
  src/core/functions/observability-plan.function.ts
  src/core/functions/prometheus-slo-rules.function.ts
  src/core/index.ts
  src/core/types/{burn-rate-alert,burn-rate-window,observability-plan,prometheus-rule-file,prometheus-slo-rules-options,slo-objective}.type.ts
  src/core/types/prometheus-alerting-rule.type.ts
  src/core/types/prometheus-recording-rule.type.ts
  src/node/functions/observability-stack.function.ts
  src/core/__tests__/index.test.ts
  src/core/__tests__/fixtures/promtool.fixture.ts
  src/core/__tests__/fixtures/slo-stack.fixture.ts
  src/core/functions/__tests__/observability-plan.function.test.ts
  src/core/functions/__tests__/prometheus-slo-rules.function.test.ts
  src/core/functions/__tests__/prometheus-slo-rules.int.test.ts
  src/node/functions/__tests__/observability-stack.function.test.ts
packages/developer/runway/
  schema/root.json
  src/core/constants/observability-section-schema.constant.ts
  src/core/functions/__tests__/parse-runway-estate.function.test.ts
tools/schemas/runway-root.schema.json
apps/docs/src/docs/runbooks/slo-burn-rate.mdx
apps/docs/src/config/docs.config.ts
.changeset/slo-burn-rate-alerts.md
.changeset/logger-otlp-collector-proof.md
.changeset/http-server-duration-recorded.md
```

## Data models and migrations

None.

## Contracts

```ts
type ObservabilityPlan["slos"] = {
  startAt: "first-paying-tenant";
  windowDays: number;
  objectives: readonly SloObjective[];
  burnRateAlerts: readonly BurnRateAlert[];
};
function prometheusSloRules(plan: Pick<ObservabilityPlan, "slos">, options?: PrometheusSloRulesOptions): PrometheusRuleFile;
```

```yaml
observability:
  slos:
    windowDays: 30
    objectives:
      - service: orders
        availability: 99.9
        latency: { thresholdMs: 500, percent: 99 }
```

- **Callers**: a stack or the generated program writes `JSON.stringify(prometheusSloRules(plan))` as a rule file.
- **Implementers**: code that builds an `ObservabilityPlan` by hand adds the three `slos` fields.

## Error handling

`observabilityPlan` adds objective failures to its single `ObservabilityConfigInvalidError` (paths
`root.observability.slos.objectives.<n>.service` and `.latency.thresholdMs`). `parseRunway` refuses the shape first
(`RunwayInvalidError`). With no traffic the error ratio is NaN and no alert fires.

## Security and tenancy

No personal data and no tenant data; the alerts carry a service name, an indicator and windows only.

## Testing strategy

- AC-001, AC-002: `otlp-collector.int.test.ts` (four tests: logs, traces, metrics, wrong secret).
- AC-003: `parse-runway-estate.function.test.ts` ("takes the window and per-service objectives…") and
  `runway-json-schema.function.test.ts` (derived schema equals the canonical file).
- AC-004 to AC-006: `observability-plan.function.test.ts` ("observabilityPlan objectives").
- AC-007: `prometheus-slo-rules.function.test.ts`; `index.test.ts` (the export); `observability-stack.function.test.ts`
  (the output).
- AC-008: `prometheus-slo-rules.int.test.ts` (`promtool test rules`, the exhaustive firing list at 4h, and the recorded
  ratios, `le="1.0"` included).
- AC-010: `serve-guarded-call.function.test.ts` ("recording the HTTP server histogram"); `emit-encore-http.function.test.ts`
  and the goldens (the adapter passes `metrics`).
- AC-011: `otlp-metrics.driver.test.ts` (advised bounds and unit, unusable bounds); `otlp-collector.int.test.ts`
  (the unit and bounds survive a real collector).
- AC-012: `prometheus-slo-rules.function.test.ts` (the missing rule) and the promtool run (a silent service).
- AC-013: `prometheus-slo-rules.int.test.ts` ("the runtime's HTTP histogram through a collector into Prometheus").
- Revert check: with the plan's objective code reverted, the objective tests fail; see "Proof run" for the review
  fixes' revert checks.

## Rollout

Minor changesets for infra-observability and runway, a patch for logger. A product starts objectives by adding
`slos.objectives` to its root runway and loading the rendered rules into its ruler.

## Known risks

- Box 2's root disk (which holds the `stackra-demo` Docker daemon) stayed full, so the proofs ran in each fixture's
  binary mode against the same pinned releases (see "Proof run"); the Docker (Testcontainers) mode of the fixtures is
  exercised first by CI's integration tier.
- Series names follow Prometheus's OTLP translation (`http_server_request_duration_seconds`, `job`); a backend with
  another translation passes `metric` and `serviceLabel`.
- Better Stack does not evaluate Prometheus rules; a Better Stack-only product graphs the recording expressions.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R2: the change waits for the CTO's approval stop before it merges.

## Proof run (2026-11-26, box 2, review fixes)

The fixtures take the pinned releases as binaries when `STACKRA_OTELCOL_BIN` and `STACKRA_PROMETHEUS_DIR` name them
(each checks `--version`): otelcol-contrib 0.165.0 and Prometheus 3.15.1, downloaded from the projects' GitHub releases
with their published SHA-256 sums checked, under `/work/stackra-b2/tools/sta-2854`.

- `pnpm --filter @stackra/logger test:int`: 5 passed (logs, traces, metrics, the HTTP server histogram in seconds, the
  refused secret). The run found a test defect: `flushIntervalMs: 50` is below the schema's minimum of 100, so every
  driver test failed to build its config; fixed.
- `pnpm --filter @stackra/infra-observability test:int`: 3 passed (promtool: fast burn pages, slow burn tickets,
  healthy quiet, silent `SloIndicatorMissing`; the broken-threshold check fails promtool; the end-to-end stack). The run
  found a test defect: exact expected ratios failed on float noise (`1.0000000000000009E-01` for `1 - x`); the ratio
  checks now `round(..., 0.0001)`.
- Revert checks: recording without the seconds advice makes the end-to-end test fail (the ratio has no series:
  `expected undefined to be close to 0.1`); dropping the missing rule, the burn-rate floor or the driver's advised
  bounds each fails its unit test.
