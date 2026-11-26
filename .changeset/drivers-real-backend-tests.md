---
"@stackra/actions": patch
"@stackra/cache": patch
"@stackra/database": patch
"@stackra/locking": patch
"@stackra/queue": patch
"@stackra/realtime": patch
---

The Valkey drivers (idempotency and rate-limit stores, cache, lock, queue broker publisher, realtime fan-out) and the Postgres lock and cache drivers now have integration tests that run against a real Valkey and a real Postgres (Testcontainers), including several instances racing on one lock, bucket, key or tag. A new queue test runs several workers on `queue.reserve_job` at once and shows that every due job is reserved exactly once, that a worker skips a job another worker holds instead of waiting for it, and that a lapsed lease goes to one worker only. `@stackra/actions`, `@stackra/cache`, `@stackra/locking` and `@stackra/realtime` gain a `test:int` script. No runtime code changes.
