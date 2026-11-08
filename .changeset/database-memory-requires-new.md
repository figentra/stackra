---
"@stackra/database": patch
---

Under the memory (PGlite) driver, `Database.transaction(work, { requiresNew: true })` inside a running transaction runs
as a savepoint instead of waiting forever for a second connection PGlite does not have. It commits with the caller
under PGlite, and a failure inside it rolls back only the savepoint; its timeouts still apply. The independent commit
is proven only in `.int` tests on Postgres. The Postgres driver's real `REQUIRES_NEW` is unchanged.
