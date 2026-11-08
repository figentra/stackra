---
"@stackra/database": patch
---

Inside a transaction, `CrudService` read verbs flush the unit of work first, so a read sees a field set earlier in the same transaction through `update` or a plain set on a loaded row (MikroORM's auto flush misses both).
