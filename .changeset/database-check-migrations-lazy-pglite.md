---
"@stackra/database": patch
---

`checkMigrations` loads PGlite and its extensions on first use, like the memory driver, so importing
`@stackra/database/testing` no longer needs the optional PGlite peers (STA-1853).
