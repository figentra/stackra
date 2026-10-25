---
"@stackra/locking": minor
---

Add `@stackra/locking`: the `Locks` service (`with` and `tryWith` over sorted keys, a TTL renewed while the work runs,
a fencing token per lease), the `LockDriver` port, the memory driver, the Postgres advisory-lock driver with its token
sequence, and `LockingConfig`.
