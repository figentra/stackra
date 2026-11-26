---
"@stackra/infra-observability": minor
"@stackra/runway": minor
---

The root runway can declare service-level objectives (STA-2854, ADR 0184 decision 3): `observability.slos.objectives` lists, per service, an availability target, a latency target (percent of requests within `thresholdMs`, a bucket bound of `http.server.request.duration`) or both, over `slos.windowDays` (7 to 90, default 30). `observabilityPlan` now returns `slos.windowDays`, `slos.objectives` and `slos.burnRateAlerts`: the four multi-window, multi-burn-rate alerts of the Google SRE workbook per objective (page at 14.4x over 1h/5m and 6x over 6h/30m, ticket at 3x over 1d/2h and 1x over 3d/6h for 30 days, scaled to the window), and refuses an objective of an unknown service, one listed twice or an off-bucket threshold. The new `prometheusSloRules(plan, options?)` renders them as a Prometheus rule file for the LGTM stack (recording rules `slo:sli_error:ratio_rate<window>` and `SloErrorBudgetBurn` alerts with `severity`, both windows and the runbook link); `promtool test rules` on a real Prometheus proves them in the package's integration tests. `observabilityStack(plan).outputs` adds `slos`. The runway schema (`schema/root.json`) accepts the two new keys. A runbook for the alert is in the docs (`runbooks/slo-burn-rate`).

Breaking only for code that builds an `ObservabilityPlan` by hand: `slos` now also needs `windowDays`, `objectives` and `burnRateAlerts`.
