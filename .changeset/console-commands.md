---
"@stackra/console": minor
"@stackra/gen": minor
"@stackra/cli": minor
"@stackra/contracts": minor
"@stackra/coding-standard": patch
"@stackra/database": minor
"@stackra/tenancy": minor
"@stackra/cache": minor
"@stackra/queue": minor
"@stackra/access-log": minor
---

Packages contribute console commands, and gen collects them per member (STA-1731). `@stackra/console` audits a
command declared `audit: true` through the `CommandAudit` port (refused before it runs when no sink is ready; secret
values redacted). gen records commands in the manifest, merges hosted packages' commands, refuses
`command_collision`, and writes `#stackra/commands` and a console entry that `stackra console <member>` runs. First
commands: `db:migrate`, `db:rollback`, `db:status`, `db:seed`, `tenant:list`, `tenant:create` (with a
`TenantDirectory` port), `cache:clear` (the `Cache` port gains `flush`), `queue:work`, `queue:failed` and
`queue:retry`; `@stackra/access-log` stores command audit entries (`STACKRA_COMMAND_AUDIT_SCOPE`).
