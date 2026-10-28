---
"@stackra/database": minor
---

Transaction options and lock modes (stackra-279). `TransactionOptions` adds `isolation` (`Isolation.ReadCommitted`,
`RepeatableRead`, `Serializable`), `readOnly`, `lockTimeout` (`set local lock_timeout`) and `retry`, which runs the
whole work again (up to 10 times, jittered back-off) after a serialization failure (`40001`) or deadlock (`40P01`).
`isolation`, `readOnly` and `retry` apply to a transaction the call starts and are refused inside a running one
without `requiresNew`. Both drivers share `runTransaction`. `Repository.lock(where, options)` takes `shared`
(`for share`), `nowait` (fail at once) or `skipLocked` (lock the first free match, or `null`).
