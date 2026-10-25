---
"@stackra/scheduler": minor
---

Add the Encore CronJob driver: `encoreCronJobs()` declares one CronJob per cron action and a minute CronJob for the
stored schedules, `SchedulerService.fire(key)` pushes one cron action's run, and `tick(at, { crons: false })` leaves
the crons of actions to their CronJobs.
