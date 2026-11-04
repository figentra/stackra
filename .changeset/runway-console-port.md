---
"@stackra/runway": minor
---

The `runway` binary runs on `@stackra/console` (ADR 0506 decision 8): `plan`, `deploy`, `promote`, `drift` and
`secrets sync` keep their words, and ADR 0352's `rollback <sha>` (refuses the head of origin/main), `status [env]`
(each GitHub environment's latest deployment record) and `validate` (schemas, placement, drivers and service
requirements; exit 1 with each finding) are new. `--json` gives each command's data in the envelope, `runway help
<command>` its help, and a usage error exits 2. `repositoryRoot` takes the folder to start from. The README lists
every command.
