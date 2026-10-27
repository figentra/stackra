---
"@stackra/collaboration": minor
---

`openRoom` takes `{ maxBackoff: Duration }` instead of `{ maxBackoffSeconds }` and reconnects through the contracts
`backoffDelay` (500 ms doubling, equal jitter, unchanged). (stackra-223)
