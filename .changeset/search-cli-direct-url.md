---
"@stackra/search": patch
---

`stackra search:reindex` and `search:status` connect with `directDatabaseUrl()` of `@stackra/database/node`
(`DATABASE_DIRECT_URL`, else `DATABASE_URL`) instead of reading `DATABASE_URL`, so they run past the pooling proxy
(ADR 0473, STA-1409).
