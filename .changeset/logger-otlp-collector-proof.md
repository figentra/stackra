---
"@stackra/logger": patch
---

The OTLP log reporter, tracer and metrics driver have an integration test against a real OpenTelemetry Collector (STA-2854, ADR 0184 decision 1): `pnpm --filter @stackra/logger test:int` (Docker) starts the pinned contrib collector in Testcontainers with a basic-auth OTLP/HTTP receiver, and checks that each signal is accepted and re-exported with its `service.name`, attributes, trace ids, severities, sums, histogram buckets and gauges, and that a wrong headers secret is refused, dropped and counted. No runtime change.
