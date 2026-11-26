---
"@stackra/contracts": minor
"@stackra/logger": minor
"@stackra/app": minor
"@stackra/gen": patch
"@stackra/infra-observability": minor
---

The runtime now emits the series the service-level objectives read (STA-2854, ADR 0184 decisions 1 and 3). `Metrics.histogram` takes optional `HistogramOptions` (a unit and explicit bucket bounds), and `@stackra/contracts` exports `HTTP_SERVER_DURATION` (`http.server.request.duration`, seconds, the semantic-convention bounds). `OtlpMetricsDriver` buckets a histogram by the bounds its first recording advises and writes the advised `unit`, so Prometheus names it `http_server_request_duration_seconds`; unusable bounds fall back to the default. `serveGuardedCall` (`@stackra/app/server`) records every answered call in that histogram with `http.request.method`, `http.route` and `http.response.status_code` (429 for a rate-limited call, 500 for one that throws) when given `metrics`, and the generated HTTP adapter hands it the bound `Metrics`. `prometheusSloRules` adds a `SloIndicatorMissing` warning per objective (the series absent for 15 minutes) and `PrometheusAlertingRule` an optional `for`; burn rates are never scaled below 1, so a short window no longer opens a ticket for a service inside its budget. The integration fixtures run the pinned collector and Prometheus as binaries when `STACKRA_OTELCOL_BIN` and `STACKRA_PROMETHEUS_DIR` name them, and an end-to-end test proves served calls reach the rules through a real collector and Prometheus.
