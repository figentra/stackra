---
"@stackra/gen": patch
"@stackra/model": patch
---

`stackra db diff` reports pivots, search columns and partial indexes faithfully. `expectedSchema` now expects each
many-to-many relation's pivot table, named by `pivotTable` or `<table>_<field>`, with the two `varchar(33)` keys the
ORM names (`<owner>_id` and `<target>_id`, or `<table>_1_id` and `<table>_2_id` for a self-reference), the owner's
`tenant_id` and their same-module foreign keys, so a migrated pivot is no longer `undeclared_table`. A `@Searchable`
model expects `search_text` and `search_filters`; `diffSchemas` tolerates the search vectors and `__v<n>` shadows only
on such a table and reports search columns on any other table as `undeclared_column`. A partial index's predicate
compares as Postgres renders it (multi-word and array casts, quoted identifiers, `<>`, `= ANY`, `<> ALL`, `~~` and
`between` folded), so a correct partial index is no longer `index_shape`.

`ManyToManyOptions` documents the pivot name the ORM uses without the option, `<table>_<field>`.
