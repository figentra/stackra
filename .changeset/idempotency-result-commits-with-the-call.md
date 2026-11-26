---
"@stackra/actions": minor
"@stackra/database": minor
---

An Idempotency-Key's result now commits with the action's writes, and a committed call never frees its key, so a retry can no longer repeat a committed write (STA-2797, ADR 0495 note of 2026-11-26). The pipeline writes the result of a store that joins transactions (the Postgres store) inside the call's transaction, after the interceptors; with no `CallIsolation` bound it opens one `UnitOfWork` transaction around such a keyed call. A Valkey or memory store is completed right after the commit, and if that write fails the caller still gets its output, the failure is logged as `actions.idempotency_store_failed`, and the key stays held. A claim now holds its key for a 15-minute lease, separate from the 24-hour replay window, so a call whose process died frees its key after the lease instead of answering in-progress for a day. The Valkey store frees or completes a key only while it still holds its own claim.

Breaking for anyone implementing `IdempotencyStore` (only the shipped memory, Valkey and Postgres drivers do): `claim(key, fingerprint, lease)` takes the lease, and `complete(key, fingerprint, output, ttl)` takes the fingerprint and the replay window, and writes the record when the key is held by that fingerprint or free.
