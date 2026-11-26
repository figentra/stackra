---
"@stackra/vitest-config": patch
"@stackra/repo-checks": patch
---

`@stackra/vitest-config` pins `@vitest/coverage-v8` at 5.0.5, the version of the `vitest` it pins beside it. It shipped 5.0.3 next to 5.0.5, and vitest peers the coverage package at exactly its own version, so a consumer resolved two copies of vitest and `describe` from `@stackra/testing` threw "Cannot read properties of undefined (reading 'config')". `stackra validate --repository` now has a `vitest-pair` rule that refuses a catalog pinning the two at different versions.
