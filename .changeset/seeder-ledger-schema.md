---
"@stackra/database": patch
---

`seederLedger` names the seed ledger table with its schema, `"database"."seed_records"`, as `applySeed` and
`seedState` do (STA-2840). Migration 0003 creates the table in the `database` schema, which is not on the search path,
so `stackra db seed` failed with `relation "seed_records" does not exist` before any seeder ran.
