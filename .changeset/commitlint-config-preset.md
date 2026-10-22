---
"@stackra/commitlint-config": minor
---

New tooling preset: the commitlint rules move out of the repo root `commitlint.config.mjs` into
`@stackra/commitlint-config`, with a `refs-issue-key` rule that is off until a repo sets it with its issue prefix.
