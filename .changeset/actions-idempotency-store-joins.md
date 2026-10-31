---
"@stackra/actions": minor
"@stackra/database": patch
---

Refuse a keyed call that joined a running transaction when the idempotency store cannot join it (STA-1699, ADR 0495
note of 2026-11-01): `IdempotencyStore.joinsTransaction` (true for the Postgres store), `UnitOfWork.inTransaction()`
(answered by the database unit of work) and the new `IdempotencyStoreNotTransactionalError`
(`idempotency_store_not_transactional`), thrown before anything is claimed or run.
