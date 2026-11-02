---
"@stackra/database": patch
---

`@stackra/database/testing`'s `snapshotKey` resolves `@electric-sql/pglite` when it is first called, not when the module
is imported, so a member without the optional PGlite peer can import `./testing` (STA-1950). A test now refuses any
peer resolved or required at module level, which the import mocks cannot see.
