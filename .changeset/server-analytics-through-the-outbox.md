---
"@stackra/actions": minor
"@stackra/analytics": minor
---

Add server analytics: `Action({ analytics })` and `Query({ analytics })` take `true` (the generic `action.called` event
with key, outcome, duration and origin) or an `AnalyticsEvent` class (its declared fields from the output, then the
input). The pipeline writes `AnalyticsTracked` (`analytics.tracked.v1`) through the outbox, in the unit of work for a
successful action, only when the call's verified consent grants `analytics`. The new `@stackra/analytics/node` entry
ships `RelayTrackedAnalyticsListener`, which sends each event to the bound `AnalyticsDriver` (stackra-410, STA-1512).
