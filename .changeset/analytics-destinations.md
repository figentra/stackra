---
"@stackra/analytics": minor
---

Send analytics to several destinations: `drivers` names extra driver instances and `destinations` lists where
deliveries go, each gated by its own consent category and routed by `include` and `exclude` event names, with its own
queue, buffer and retries. Adds the `AnalyticsDriverLookup` port and its `none` driver.
