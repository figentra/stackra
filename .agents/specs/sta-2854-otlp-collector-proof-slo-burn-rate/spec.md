# Feature Specification: OTLP proven against a real collector, and SLO burn-rate alerts

**Feature Branch**: `figentra/sta-2854-otlp-collector-proof-slo-burn-rate`

**Created**: 2026-11-26

**Status**: Implementing

**Tier**: feature

**Approver**: the CTO (the change risk's approval stop)

**Linear**: STA-2854

**Clarifications status**: complete

**Input**: Stackra's logger sends logs, traces and metrics as OTLP/JSON with hand-written drivers, tested only against a
fake `fetch`; nobody had shown that a real OpenTelemetry Collector accepts what they send. Service-level objectives and
their alerts did not exist: ADR 0184 decision 3 defines the indicators now and starts objectives at the first paying
tenant, but a product had no way to declare an objective or get a burn-rate alert when it reaches that point. This
change adds an integration test of the three OTLP drivers against a real collector, the `observability.slos.objectives`
and `slos.windowDays` keys of the root runway, the multi-window, multi-burn-rate alerts of each objective in the plan,
`prometheusSloRules(plan)` for the LGTM stack's ruler with a `promtool test rules` proof, and a runbook for the alert.
Readiness batch 11, item 11.3.

### Sources

- `packages/foundation/logger/src/core/drivers/otlp-{log-reporter,tracer,metrics}.driver.ts` and the `otlp-*-body`
  functions (what is sent)
- `packages/infrastructure/infra-observability/src/core/functions/observability-plan.function.ts` (the plan, `SliKind`)
- `packages/developer/runway/src/core/constants/observability-section-schema.constant.ts` and
  `tools/schemas/runway-root.schema.json` (the runway's closed `observability` block)
- ADR 0184 (decisions 1 to 3: OTLP to a collector, the optional LGTM stack, indicators now and objectives from the
  first paying tenant), ADR 0185 decision 1 (critical pages on-call), ADR 0182 (test tiers), ADR 0269 (Testcontainers)
- The Google SRE workbook, "Alerting on SLOs" (the recommended multi-window, multi-burn-rate parameters)
- The OpenTelemetry HTTP semantic conventions (`http.server.request.duration` and its advised bucket bounds)

## Impact

- **Apps touched**: docs (a new runbook `runbooks/slo-burn-rate` and its navigation entry)
- **Services touched**: none
- **Packages touched**: logger (an integration test, its collector fixture, a `test:int` script, `testcontainers` as a
  dev dependency, README); infra-observability (the `slos` schema keys, the plan's objectives and burn-rate alerts,
  `prometheusSloRules`, new types and constants, `observabilityStack` outputs `slos`, unit and integration tests,
  README); runway (the `slos.windowDays` and `slos.objectives` keys of the closed `observability` block, the canonical
  and shipped JSON schema, a test)
- **Public contract change**: `ObservabilityPlan["slos"]` gains `windowDays`, `objectives` (`SloObjective[]`) and
  `burnRateAlerts` (`BurnRateAlert[]`); new exports `prometheusSloRules`, `BurnRateAlert`, `SloObjective`,
  `PrometheusRuleFile`, `PrometheusRecordingRule`, `PrometheusAlertingRule`, `PrometheusSloRulesOptions`;
  `observabilityStack(plan).outputs.slos`; the root runway schema accepts `observability.slos.windowDays` and
  `observability.slos.objectives`. Breaking only for code that builds an `ObservabilityPlan` by hand.
- **Cross-service events**: none
- **Tenancy and data**: none; no table, no tenant data. The rules read request counters only.
- **Security and privacy**: no personal data. The collector test makes a random basic-auth password per run and passes
  it to the container as an environment variable; nothing is written to the repository.
- **Secrets**: none
- **ADR needed**: no new ADR; implements ADR 0184 decision 3 (objectives when the product declares them) and uses
  decision 2 (the LGTM stack evaluates Prometheus rules)
- **New dependencies**: `testcontainers` (catalog, dev only) in logger and infra-observability
- **Deploy modes**: same in all three; the rules are a file the operator loads into Mimir or Prometheus
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `apps/docs/src/docs/runbooks/slo-burn-rate.mdx` (new), `apps/docs/src/config/docs.config.ts`,
  `packages/infrastructure/infra-observability/README.md`, `packages/foundation/logger/README.md`, the runway root
  schema (`tools/schemas/runway-root.schema.json`, `packages/developer/runway/schema/root.json`), changesets
- **Lane**: full
- **Change risk**: R2 (a public type grows and a runway key is added; no auth, tenancy, secret or HTTP shape change)

## Acceptance criteria

- **AC-001**: WHEN the OTLP log reporter, tracer and metrics driver send to a real OpenTelemetry Collector behind basic
  auth taken from the headers secret, THE collector SHALL accept and re-export each signal with its `service.name`,
  attributes, trace and parent ids, severities, monotonic sums, histogram buckets and gauges intact.
- **AC-002**: IF the headers secret is wrong THEN the collector SHALL refuse the batch, and THE driver SHALL drop it and
  count it in `dropped`, with nothing of it exported.
- **AC-003**: THE root runway SHALL accept `observability.slos.objectives` (per service: `availability` percent,
  `latency` `{ thresholdMs, percent }`, or both) and `observability.slos.windowDays` (7 to 90), and refuse an objective
  with neither indicator, an out-of-range value or a misspelt key.
- **AC-004**: WHEN the runway declares an objective, THE plan SHALL derive four burn-rate alerts for it: page
  (`critical`) at 2% of the budget in 1h (5m short window) and 5% in 6h (30m), ticket (`warning`) at 10% in 1d (2h)
  and 10% in 3d (6h), which over 30 days are burn rates 14.4, 6, 3 and 1, scaled to `windowDays`.
- **AC-005**: IF an objective names a service that is not a member, is listed twice, or has a latency threshold that is
  not a bucket bound of `http.server.request.duration` THEN THE plan SHALL refuse it with the path.
- **AC-006**: THE plan SHALL declare no objective or alert while the runway declares none.
- **AC-007**: `prometheusSloRules(plan)` SHALL render per objective a recording rule of the error ratio per window and
  one `SloErrorBudgetBurn` alert per burn-rate row, firing while both its windows are above the threshold, labelled
  with service, indicator, severity and windows and linking the runbook; series names and the service label are
  overridable.
- **AC-008**: ON a real Prometheus (`promtool test rules`), a fast burn SHALL page, a slow burn SHALL only open a
  ticket, and a healthy service SHALL stay quiet.
- **AC-009**: THE docs SHALL hold a runbook for an SLO burn alert.

## Status history

- 2026-11-26 → Clarified (from readiness item 11.3 and STA-2854's done-when list)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md)
- 2026-11-26 → Implementing (built in this branch; the two Docker proofs wait for box 2's disk, see plan.md)
