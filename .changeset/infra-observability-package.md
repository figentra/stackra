---
"@stackra/infra-observability": minor
---

Add `@stackra/infra-observability` (ADR 0171, ADR 0184): `observabilityPlan` checks the root runway's `observability`
section and plans the telemetry (the OTLP destination and its 30-day hot and 13-month S3 retention, a heartbeat per
cron, relay and worker in each deployed environment, a Sentry project per app and availability and latency indicators
per service); `./node` adds `observabilityStack` and its parts `logPipeline`, `sentryProjects` and `heartbeatMonitors`,
the Pulumi programs that declare them on Better Stack, Sentry and AWS and export the values the runways' `ref:` paths
name.
