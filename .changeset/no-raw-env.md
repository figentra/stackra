---
"@stackra/coding-standard": minor
"@stackra/oxlint-config": minor
---

New house rule `stackra/no-raw-env` (ADR 0173 amendment 2026-11-04, STA-2104): a named read of `process.env` or
`import.meta.env` outside configuration classes, generated code, tooling and tests is reported, so every name is
declared once in a `Config({ schema, env })` class or with `@Secret`. The base preset turns it on at `warn` while the
current reads migrate; it moves to `error` with the last one.
