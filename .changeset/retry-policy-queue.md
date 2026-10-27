---
"@stackra/queue": minor
---

`Backoff` moves to @stackra/contracts and is re-exported here. `backoffDelay` is removed: use the contracts
`backoffDelay({ ...JOB_BACKOFF, backoff }, attempt)`; `JOB_BACKOFF` keeps the old 10 s base, half-again jitter and
one-hour cap. (stackra-223)
