---
"@stackra/database": patch
---

`MemoryDatabaseDriver` starts each instance from a PGlite snapshot built once per migrations set and kept in a temp file, instead of running initdb, the extensions and the migrations every time (STA-1685). Every instance still gets its own fresh database.
