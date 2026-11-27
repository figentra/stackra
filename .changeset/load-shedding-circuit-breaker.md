---
"@stackra/contracts": minor
"@stackra/app": minor
"@stackra/integrations": minor
"@stackra/gen": minor
---

An overload or a slow provider no longer cascades into a whole-service failure. `@stackra/contracts` adds `Bulkhead`
(bounded concurrency with a bounded first-come queue and wait) and `CircuitBreaker` (closed, open, half open with trial
calls). The server `createApp` admits every call of `handlers.run` through one `Bulkhead` sized by `app.http`
(`maxConcurrentCalls` 1024, `maxQueuedCalls` 1024, `maxQueueWaitMs` 5000; `maxConcurrentCalls: 0` turns it off) and
refuses the excess with the new `AppOverloadedError` (`app_overloaded`, 503, retryable) before its request container
exists, counting `app.calls.shed` on the bound `Metrics`. The new `handlers.shed` answers a shed or draining call 503
with its envelope, `Retry-After`, `Cache-Control: no-store` and the CORS headers, and the HTTP adapter gen writes calls
it, so regenerate after upgrading `@stackra/app` and `@stackra/gen` together. A cron run is never shed: the generated
cron adapter calls `handlers.run(call, { shed: false })` (the new `ServerRunOptions`), since Encore never retries a
failed CronJob invocation. The integrations managed client aborts each attempt at the Integration's new `timeout` (30
seconds by default, the body read included) and goes through a circuit breaker per Integration and origin (5 failures in
a row open it for 30 seconds; `circuitBreaker` tunes it or `false` turns it off) and, with the new `concurrency` option,
a bulkhead; a call refused without being sent, or whose last attempt timed out, is `ProviderUnavailableError` with
`reason` `circuit_open`, `bulkhead_full` or `timeout` (STA-1467).
