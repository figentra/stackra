---
"@stackra/database": minor
"@stackra/actions": minor
---

Add runtime database timeouts: `DatabaseConfig.timeouts` (statement, lock, idle in transaction) passed to `connect` as
`DatabaseOptions.timeouts` and set on every primary and replica session, `TransactionOptions.timeout` as a
transaction-local statement timeout, and an action's `timeout` option that the pipeline hands to
`UnitOfWork.transaction(work, { timeout })`.
