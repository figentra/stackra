---
"@stackra/database": minor
"@stackra/actions": minor
---

Raise database errors as refusals at the action boundary: `translateDbError` maps an optimistic-lock failure to
`StaleVersionError` (409), a unique violation to `DuplicateRecordError` (409), foreign-key, check and not-null
violations to `ConstraintViolatedError` (400) and deadlocks, serialization failures and timeouts to the retryable
`TransactionConflictError`. `CrudService.update` takes `expectedVersion`, and `CallOptions.expectedVersion` (from
If-Match) reaches handlers as `ctx.expectedVersion`.
