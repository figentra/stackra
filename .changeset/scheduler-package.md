---
"@stackra/scheduler": minor
---

Add `@stackra/scheduler`: cron dispatch of job actions (`job: { cron }`, once for the platform or, with `perScope`,
once per scope) and
per-scope schedules kept as data with a time zone and a misfire policy, ticked once a minute on one runner with
bounded catch-up, pushed through `@stackra/queue`, with the memory and Postgres schedule drivers and the `tick` test
helper.
