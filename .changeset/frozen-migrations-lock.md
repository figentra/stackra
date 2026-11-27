---
"@stackra/gen": minor
"@stackra/database": minor
---

Locked migrations are frozen (ADR 0159, STA-2160). A service's `stackra gen` now writes a `migrations` section to its `stackra.manifest.json`: each compiled migration's id and the SHA-256 of what it compiled to, in apply order. From then on gen refuses a locked migration that compiles to other SQL (`migration_locked_changed`), one that is gone (`migration_locked_missing`), one that an unlocked migration would run before (`migration_lock_gap`) and a malformed section (`migration_lock_malformed`). The locked migrations keep their place at the head of the order, so a new migration, a new package's included, runs after them; `stackra db diff` reads the same lock.

`compileMigration` takes `frozen: true` for a locked migration: an authoring rule that only checks how it is written (every column states its nullability and has a comment) comes back in `warnings` instead of throwing, which gen reports as a `migration_rule_frozen` warning, and the SQL must still hash as locked. Safety rules still refuse. A migration the lock does not name stays editable and meets every rule.

Upgrading: run `stackra gen` in each service with migrations and commit its `stackra.manifest.json`; until then `stackra gen --check` reports the manifest as stale. To change a locked migration that no environment has applied, remove its entry from `migrations` by hand and run `stackra gen` again. A package's own migrations are checked but not locked; the services that host the package lock them.
