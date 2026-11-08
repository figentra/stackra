---
"@stackra/gen": patch
---

The generated Vitest setup imports `@stackra/actions/testing` for a member on `@stackra/actions`, so a `useDrivers("memory")` test that only queues work finds the memory `AccessControl`.
