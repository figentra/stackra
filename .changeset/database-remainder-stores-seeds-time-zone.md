---
"@stackra/database": minor
---

Add the Postgres `IdempotencyStore` and `RateLimitStore` drivers for `@stackra/actions` and their tables, the seed
runner (`seedState`, `applySeed`) over a new `database.seed_records` ledger, and the `SequenceTimeZone` port with
`connectSequenceTimeZone`: a yearly series reads its year in its owner's time zone setting. The migration compiler
now refuses a raw `CREATE SEQUENCE` (ADR 0394, 0396).
