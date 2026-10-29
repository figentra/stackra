---
"@stackra/contracts": minor
"@stackra/logger": minor
"@stackra/transport": minor
"@stackra/app": minor
---

OTLP for all three signals (ADR 0184 decision 1, STA-1572). `@stackra/contracts`: `Tracer` gains
`continueTrace(carrier, work)` and `traceparent()` (implementers of `Tracer` must add both; `NoopTracerDriver` runs the
work and names no parent), the `TraceCarrier` type, and a new `Metrics` port (counter, histogram, gauge) with
`NoopMetricsDriver`. `@stackra/logger`: `OtlpTracerDriver` (spans to `/v1/traces`, nesting through
`AsyncLocalStorage`, W3C trace continuation, the edge request id on every span, `traceSampleRatio` sampling) and
`OtlpMetricsDriver` (cumulative sums, gauges and explicit-bucket histograms to `/v1/metrics` every
`metricIntervalMs`), `parseTraceparent` and `formatTraceparent`; `OtlpConfig` adds `traceSampleRatio` and
`metricIntervalMs`; the log reporter shares the batching sender, counts what it drops (`dropped`) and flushes on
shutdown. `@stackra/transport`: the `traceContext(tracer)` middleware and `TRANSPORT_HEADERS.traceparent`.
`@stackra/app`: the server `createApp` continues each request's trace (its `traceparent` and `x-figentra-request-id`,
taken once the guards pass) when a `Tracer` is bound.
