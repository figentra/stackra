# Plan: analytics gen refusals (STA-1891)

1. `AnalyticsBatchAccepted`: `name: "batch.accepted"`; `@Field(z.array(ANALYTICS_DELIVERY_SCHEMA).min(1))` with a
   reason on `deliveries`.
2. `IngestAnalyticsBatchInput`: inline the hatch's zod; drop the local constants.
3. oxfmt and oxlint; gen and tests run in CI.
