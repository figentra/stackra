---
"@stackra/analytics": minor
---

`AnalyticsDelivery` envelope v2: every delivery now carries `eventId` (`evt_` and a time-ordered Crockford id, for
dedup across destinations), `anonymousId` and `sessionId` (made only after consent, held in memory for the launch),
an optional `userId`, and an `AnalyticsContext` (library, page path, locale; screen, app version and region when set).
The PostHog drivers send these ids instead of making their own. Drivers of `AnalyticsDriver` must accept the new
fields.
