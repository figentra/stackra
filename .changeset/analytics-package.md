---
"@stackra/analytics": minor
---

Add `@stackra/analytics`, consent-gated product analytics delivery per ADR 0298: `AnalyticsClient.track` sends an `AnalyticsEvent` through the `AnalyticsDriver` port only once its consent category is granted, holds earlier events in a bounded ordered queue that is sent on acceptance and discarded on refusal, with `AnalyticsConfig` and its shipped schema, the `none` driver, `useAnalytics` and `fakeAnalytics`.
