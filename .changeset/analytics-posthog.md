---
"@stackra/analytics": minor
---

Add the `posthog` analytics driver: `PosthogAnalyticsDriver` in `.` posts each send to PostHog's batch capture endpoint
with plain `fetch`, behind the client's consent gate and bounded queue, with an in-memory anonymous id created only on
the first send after consent and no person profile. Add `posthogKey` and `posthogHost` to `AnalyticsConfig`. Add the
`./native` entry, whose `PosthogAnalyticsDriver` batches 20 events and flushes when React Native's `AppState` goes to
the background (React Native is an optional peer). Move `MemoryAnalyticsDriver` from `./testing` to `.`, since gen's
wiring offers it as a production driver and production code never imports `./testing`.
