---
"@stackra/database": minor
---

`$raw` takes one fragment or several ANDed, and the new `jsonContains`, `jsonPath`, `ancestorOf` and `descendantOf`
build parameterised fragments for it. `CrudService.countDistinct` (and `Repository`) shares `sum`'s aggregate path and
the visibility filter. `DatabaseOptions.replicas` and `Database.onReplica` run a read-only replica transaction that
replays the running `app.*` settings, so row-level security holds there; `preferReadReplicas` stays off.
