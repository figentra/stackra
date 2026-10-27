---
"@stackra/database": minor
---

`Blueprint.change(column)` changes an existing column in a frozen migration: `nullable()` (drop NOT NULL), `notNull()`
(set NOT NULL, a contract step) and `type(to, { from, using? })`, each compiled with its inverse from the migration's
own literals; refused on a table being created, on a column the blueprint adds, twice, or when it changes nothing. New
type `ColumnChange` (STA-918).
