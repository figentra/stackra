---
"@stackra/gen": minor
---

Emit a service's Encore CronJobs (`.stackra/encore/<member>/cron.ts`, ids by the new `cronJobId`) and broker-delivered
queue topics and subscriptions (`queues.ts`); lock each Integration's egress entry, keeping a `{field}` host as data
(`egressOf`, `egress_invalid`); refuse `sequence_misplaced` and `cron_job_collision`; connect the legal-hold registry
and the sequence time zone in the boot; bind `SequenceService`, the floor-aware `SettingsReader` and
`SettingsResolver` where injected.
