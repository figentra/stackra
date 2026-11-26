---
"@stackra/cli": minor
---

The coverage floors now run. `stackra check --with-tests` (and so `stackra verify`) adds a `coverage` phase after
`test`: `turbo run test:coverage`, one finding per member below its floor. `stackra test --coverage` measures a
member's unit tier (`turbo run test:coverage` at the workspace root), and `stackra new service` writes a
`test:coverage` script and `@vitest/coverage-v8`, so services join the coverage gate (ADR 0182 decision 2).
