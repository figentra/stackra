---
"@stackra/reports": minor
---

Add the `ProductAnalytics` port to `@stackra/reports/contracts` (funnels, retention tables and behavioural cohorts as
counts of people, with `RetentionPeriod` and the query and result types) and its first driver,
`PosthogProductAnalyticsDriver` in `./node`, which posts structured `FunnelsQuery`, `RetentionQuery` and `TrendsQuery`
nodes to PostHog's query API with a key from the runtime secret store, narrowed to the call's scope. Configured by
`ReportsConfig.productAnalytics` and `ReportsConfig.posthog`; refusals `ProductAnalyticsQueryInvalidError`,
`ProductAnalyticsScopeMissingError` and `ProductAnalyticsUnavailableError`.
