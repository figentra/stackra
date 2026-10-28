---
"@stackra/queue": minor
---

Fair queues (ADR 0148 d2): a reservation takes the highest `priority`, then the scope with the fewest running jobs,
never past a job's `scopeConcurrency`; `job.throttle` takes a token from the `RateLimitStore` before each attempt
(`JobOutcome.Throttled`); `QueueService.chain`, `batch` and `progress`; `QueueDriver.release`, `openBatch`,
`settleBatch` and `batch`; migration `queue.0002_add_job_fairness` with `queue.job_batches`; and the
`runQueueConformance` suite every driver passes.
