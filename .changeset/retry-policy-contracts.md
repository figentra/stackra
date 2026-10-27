---
"@stackra/contracts": minor
---

Add the one retry shape and formula: `RetryPolicy` (attempts, base, max, backoff, multiplier, jitter, retryOn), the
`Backoff`, `Jitter` and `RetryOn` enums and `backoffDelay(policy, attempt)`. `Duration.parse` also reads the short form
(`"200ms"`, `"30s"`, `"6h"`, `"1d"`). (stackra-223)
