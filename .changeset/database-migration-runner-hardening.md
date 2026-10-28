---
"@stackra/database": minor
---

Harden the migration runner: a session advisory lock so concurrent runners wait, a `schema_migrations_history` ledger
with each file's checksum and `applied_at` (an edited applied file is refused), a per-file
`-- stackra:timeout=<interval>` header, and cleanup of the INVALID index a failed concurrent build leaves.
