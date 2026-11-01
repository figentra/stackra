---
"@stackra/database": patch
---

The testing entry loads its optional peers (`@faker-js/faker`, `@electric-sql/pglite`,
`@electric-sql/pglite-pgvector`, `@mikro-orm/pglite`) on first use, not on import, so a service without them can load
`@stackra/database/testing`. A test that needs one that is missing gets an error naming all four.
