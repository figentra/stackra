---
"@stackra/integrations": minor
---

The `Interval` string and the package's `RetryPolicy` type are removed. Every length (`rateLimits[].per`,
`health.every`, `auth.expiresIn`, `auth.refresh.buffer`, `webhooks.signature.tolerance`, `saveLinkLifetime`) is a
`Duration`; write `Duration.seconds(1)` or `Duration.parse("1s")`. `retry` is the contracts `RetryPolicy` plus
`idempotencyHeader`: `backoff` and `maxDelay` became `base` and `max`, with the same defaults (3 attempts, 200 ms
doubling, 30 s). (stackra-223)
