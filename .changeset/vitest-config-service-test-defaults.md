---
"@stackra/vitest-config": minor
---

The base preset now sets `pool: "forks"`, `maxWorkers` at half the CPUs (override with `STACKRA_TEST_MAX_WORKERS`), `testTimeout` 30 s and `hookTimeout` 60 s, so PGlite-backed service tests stop timing out at 5 s on a busy machine (STA-1685).
