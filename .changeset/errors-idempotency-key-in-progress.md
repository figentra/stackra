---
"@stackra/errors": minor
---

New refusal `IdempotencyKeyInProgressError` (`idempotency_key_in_progress`, a retryable conflict) for an Idempotency-Key sent again while its first call still runs, and `storedRefusal` / `refusalFromStored` with the `StoredRefusal` type, to keep a refusal in a store and raise it again equal.
