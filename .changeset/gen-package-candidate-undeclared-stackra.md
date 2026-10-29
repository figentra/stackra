---
"@stackra/gen": patch
---

A package's own wiring lists a declared package's driver candidate without its tokens when they come from a
`@stackra/*` package it does not declare, as it already did for an undeclared library. `@stackra/data-transfer` stops
importing `@stackra/database` through the outbox's `postgres` `ChangeFeed`, and `@stackra/database` stops importing
`@stackra/storage` through the cache's `storage` driver (`generated_dependency_missing`). Its tests take the port's
default driver; a service, app or worker keeps the tokens and must declare the package.
