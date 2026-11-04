---
"@stackra/runway": minor
---

`runway env check --values --env <env>` and `runway env orphans <env>` (ADR 0173 amendment 2026-11-04, STA-2104).
In a CI job its GitHub OIDC token proves, the value check reads each declared name from its Infisical home and checks
it against its rules (missing, type, bounds, refused prefixes): an error in the deployed environment, a warning in its
sibling non-production environments. It prints names, pass or the broken rule and at most a SHA-256 prefix, never a
value. `env orphans` warns on Infisical names no code declares. `--project-id` takes the job's runtime project.
