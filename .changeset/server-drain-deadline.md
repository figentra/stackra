---
"@stackra/app": minor
---

The server `createApp` bounds its shutdown drain. `drain()` waits for calls in flight for at most
`HttpConfig.drainTimeoutSeconds` (`app.http`, 1 to 600, 20 by default); at that deadline it reports one
`DrainTimeoutError` (the count still running and the deadline) through the `ErrorReporter` and resolves, so `close()`
and SIGTERM still run the shutdown hooks (the outbox flush among them) before the platform's SIGKILL. Before, one hung
call kept the process alive until it was killed. `DrainTimeoutError` is exported from `@stackra/app/server`.
