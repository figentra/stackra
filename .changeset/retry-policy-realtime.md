---
"@stackra/realtime": minor
---

`maxBackoffSeconds: number` becomes `maxBackoff: Duration` (default `Duration.seconds(30)`, at least one second);
the reconnect wait is the contracts `backoffDelay` with the same 1 s doubling and equal jitter. (stackra-223)
