---
"@stackra/actions": minor
"@stackra/database": minor
---

A detached call (`ctx.detach()`) now works with the database. `detached.run` enters every wrapper registered in the new `DETACHED_RUNS` (`@stackra/actions/contracts`), and the database registers one when a driver connects: the loop's work runs on a fresh fork, outside the call's committed transaction (which MikroORM otherwise keeps in the context of a continuation started inside it), and `Database.detached()` answers the call's step, per database instance. Inside a detached call, every `CrudService` operation that runs outside a transaction runs as its own step: a short transaction with the call's isolation (`each`, `chunk` and `metrics` excepted). Outside a detached call nothing changes.
