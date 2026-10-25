---
"@stackra/access-log": minor
---

Add `@stackra/access-log`: the `@AccessLogged` class facet and its Explorer, a per-tenant SHA-256 hash chain over the
access records (`linkAccessRecord`, `findChainBreak`) with memory and Postgres sinks, the append-only `AccessLogEntry`
table with the `t.dataClassification()` macro, the retention job, and the sink fake and `toHaveLoggedAccess` matcher.
