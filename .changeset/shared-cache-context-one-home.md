---
"@stackra/actions": patch
"@stackra/database": patch
---

`SHARED_CACHE_CONTEXT` has one home: `@stackra/actions` exports it from its `.` entry, and `@stackra/database`'s entity
cache and cache invalidation import it from there instead of declaring their own copy.
