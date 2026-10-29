---
"@stackra/gen": patch
---

A package's own wiring no longer binds the `SERVER_CONTRIBUTIONS` classes it ships (`QueryCacheEvictorListener` in
`@stackra/actions`), nor links the driver tables their tokens reach, so `@stackra/actions` stops importing
`@stackra/storage` through the cache's storage candidate (`generated_dependency_missing`). A service that declares the
contribution's package still binds it (STA-1445).
