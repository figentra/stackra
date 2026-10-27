---
"@stackra/workflow": minor
---

`StepRetry` is removed: `@Step({ retry })` takes `Pick<RetryPolicy, "attempts" | "backoff">` from @stackra/contracts;
the waits are the contracts `backoffDelay` over the queue's `JOB_BACKOFF`, unchanged. (stackra-223)
