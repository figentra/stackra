---
"@stackra/queue": minor
---

Add the `broker` queue driver (`BrokerQueueDriver`, `./node`): jobs are published to the `queue.<queue>` Pub/Sub topics
gen's `emitEncoreQueues` emits and run when the generated subscription calls `QueueWorkerService.process`. A retry is
published again with its `runAt`; a job delivered early is refused with the new `JobNotDueError` (`job_not_due`) so the
broker redelivers it; dead letters stay in `queue.jobs` for `deadLetters` and `redrive`. `QueueDriver` gains a concrete
`claim(job, now)` (the default answers the job as it is), which `process` now calls before it runs a job.
