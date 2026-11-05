---
"@stackra/runway": minor
---

`runway env check` (ADR 0173 amendment 2026-11-04, STA-2104): the names-only environment check. Every declared name
(a member manifest's `env` rows, a member runway's `secrets:`, a workflow Infisical step's `secret-name:`) must have an
Infisical home; a raw read of an undeclared name, an export-all step and a deploy secret no code declares are
warnings. No login, never a value. The Quality Gate runs it on every pull request.
