---
"@stackra/transport": minor
---

`retry` takes the contracts `RetryPolicy` plus `maxWait`: `delay(attempt)` became `base`/`max`/`multiplier`/`jitter`
(200 ms doubling to 5 s by default, unchanged) and the `network`/`refused` switches became `retryOn`
(`RetryOn.Network` retries no refusal). (stackra-223)
