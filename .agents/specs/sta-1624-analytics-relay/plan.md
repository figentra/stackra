# Plan: analytics relay (STA-1624)

**Input**: `.agents/specs/sta-1624-analytics-relay/spec.md`, ADR 0483.

## Shape

```text
app (web, native)                         analytics service (per region)
AnalyticsClient ─ consent, queue, lanes   IngestAnalyticsBatchAction  POST /analytics/batches
  └ RelayAnalyticsDriver ──── batch ────▶   ctx.consent() (pipeline-verified snapshot)
      + Stackra-Consent                     subject binding, denyProperties, routing
                                            └ ctx.publish(AnalyticsBatchAccepted) per destination
                                          FanOutAnalyticsListener ── outbox, retried per event
                                            └ posthog (free) · ga4 (Pro)
```

## Lanes (one commit each, in order; each builds on the last)

1. **contracts**: `AnalyticsContext.device`; the delivery schema; the contracts type test.
2. **relay driver**: `RelayAnalyticsDriver` in `src/core/drivers` and `src/native/drivers`; `relay` in
   `AnalyticsDriverName` and the schema enum; `ANALYTICS_INGEST_PATH`; barrels and their tests.
3. **ingest and fan-out**: `IngestAnalyticsBatchAction`, its input and output schemas, `AnalyticsBatchAccepted`,
   `FanOutAnalyticsListener`; `./node` barrel and its test.
4. **PostHog mapping and docs**: `$os` and friends, `$geoip_disable` for relayed batches; README, AGENTS, changeset.

## Notes for the tester

- Nothing ran on the Mac but oxfmt and oxlint. Expect the usual first-run fixes (exact optional properties, override
  markers, the `node/index.test.ts` export list).
- The action uses the declared-schema escape hatch (`@Field(zod)`) for the deliveries list, as the consent action does.
