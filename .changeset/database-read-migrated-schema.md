---
"@stackra/database": patch
---

`@stackra/database/node` exports `readMigratedSchema(files, schemas)`: it replays compiled migration steps on an
in-memory PGlite with the approved extensions and reads back the tables, columns (type and nullability), indexes and
foreign keys of the given schemas as plain data (`MigratedSchema`). It is what `stackra db diff` compares the models
with. It needs the optional peer `@electric-sql/pglite`, and `@electric-sql/pglite-pgvector` for `vector`, and says so
when they are missing.
