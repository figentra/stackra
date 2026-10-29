---
"@stackra/analytics": minor
"@stackra/privacy": patch
---

Erasure reaches the analytics vendor (STA-1582). `AnalyticsDriver.erasePerson(subject)` deletes the subject's person
and its events at the vendor: the `posthog` driver finds it by distinct id through the private API and deletes it with
`delete_events` and `delete_recordings`, `none` deletes nothing and `memory` records the subject; any other driver
rejects by default. `EraseAnalyticsPersonListener` (`./node`) calls it after `SubjectErased` and logs
`analytics.erasure.erased`. New config `posthogApiHost`, `posthogProjectId` and the
`ANALYTICS_POSTHOG_PERSONAL_API_KEY` secret (`posthogPersonalApiKey`); without them the erasure rejects instead of
succeeding silently. The privacy README lists the analytics listener among the erasure fan-out.
