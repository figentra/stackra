---
"@stackra/vitest-config": minor
"@stackra/database": patch
"@stackra/fiscal": patch
"@stackra/iam": patch
"@stackra/privacy": patch
---

The integration tier runs (STA-1570). `@stackra/vitest-config/int` adds `intTier(config)` and `INT_TESTS`
(`src/**/__tests__/**/*.int.test.{ts,tsx}` and gen's `.stackra/tests/**/*.int.test.ts`); `servicePreset`'s `int`
project uses the same globs. The members with `.int.test.ts` files gain `vitest.int.config.ts` and a `test:int` script,
which the new turbo task `test:int` and the Quality Gate run on a Testcontainers Postgres.
