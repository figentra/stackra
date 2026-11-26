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
2. `observabilityPlan` checks each objective (member, duplicate, bucket bound against `HTTP_DURATION_BOUNDS`), maps it
   to one `SloObjective` per indicator, and multiplies each by the four `BURN_RATE_WINDOWS` rows into `BurnRateAlert`s.
3. `prometheusSloRules(plan, options)` reads `plan.slos` only: per objective a group `slo-<service>-<kind>` with the
   recording rules `slo:sli_error:ratio_rate<window>{slo_service, slo}` (availability: 5xx count rate over all; latency:
   one minus the threshold bucket's rate over all) and the `SloErrorBudgetBurn` alerts
   (`long > threshold and short > threshold`).
4. `observabilityStack` passes `plan.slos` through to its outputs.

## Components and responsibilities

- `BURN_RATE_WINDOWS`: the four SRE-workbook rows (budget share, long and short window, severity).
- `HTTP_DURATION_BOUNDS`: the advised bounds of `http.server.request.duration`, in seconds.
- `SloObjective`, `BurnRateAlert`, `BurnRateWindow`: plan data.
- `PrometheusRuleFile`, `PrometheusRecordingRule`, `PrometheusAlertingRule`, `PrometheusSloRulesOptions`: the rendered
  file and its naming overrides (`metric`, `serviceLabel`, `runbookUrl`).
- `startCollector()` (logger test fixture): the collector with a basic-auth OTLP/HTTP receiver and a JSON-lines file
  exporter read back out of the container.
- `promtoolTestRules()` (infra-observability test fixture): copies the rules and the test file into a Prometheus
  container and runs `promtool test rules`.

## Files and folders

```text
packages/foundation/logger/
  README.md
  package.json
  vitest.int.config.ts
  src/core/drivers/__tests__/otlp-collector.int.test.ts
  src/core/drivers/__tests__/fixtures/otel-collector.fixture.ts
packages/infrastructure/infra-observability/
  README.md
  package.json
  vitest.int.config.ts
  src/core/constants/burn-rate-windows.constant.ts
  src/core/constants/http-duration-bounds.constant.ts
  src/core/constants/observability-schema.constant.ts
  src/core/functions/observability-plan.function.ts
  src/core/functions/prometheus-slo-rules.function.ts
  src/core/index.ts
  src/core/types/{burn-rate-alert,burn-rate-window,observability-plan,prometheus-rule-file,prometheus-slo-rules-options,slo-objective}.type.ts
  src/node/functions/observability-stack.function.ts
  src/core/__tests__/index.test.ts
  src/core/__tests__/fixtures/promtool.fixture.ts
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
- Revert check: with the plan's objective code reverted, the objective tests fail.

## Rollout

Minor changesets for infra-observability and runway, a patch for logger. A product starts objectives by adding
`slos.objectives` to its root runway and loading the rendered rules into its ruler.

## Known risks

- The two Docker proofs (collector and promtool) could not run on box 2 when this was built: the root disk that holds
  the `stackra-demo` Docker daemon was full (100%), so no image could be pulled. They run in CI's integration tier and on
  box 2 once space is freed; any defect they find is fixed in this branch before merge.
- Series names follow Prometheus's OTLP translation (`http_server_request_duration_seconds`, `job`); a backend with
  another translation passes `metric` and `serviceLabel`.
- Better Stack does not evaluate Prometheus rules; a Better Stack-only product graphs the recording expressions.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R2: the change waits for the CTO's approval stop before it merges.
