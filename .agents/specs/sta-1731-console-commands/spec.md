# Feature Specification: console commands contributed by packages, collected per member by gen

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1731 (phase 2 of STA-1730)

**Clarifications status**: complete

**Input**: the owner's request of 2026-10-31 (Linear STA-1731), the leader's go-ahead of 2026-11-01, and ADR 0506
(decisions 4 to 6: the `commands/` group, `@stackra/console` holds no module's commands, `#stackra/commands` is an
explicit list gen writes with duplicates refused). Phase 1 (STA-1730) shipped the `Command` kind, the kernel, the
look and the standalone path `createConsole({ commands })`. Today the `stackra` binary has one hand-written list
(`COMMANDS`, `packages/developer/cli/src/node/constants/commands.constant.ts`), and no app or service has a console.

## Impact

- **Apps touched**: none in this spec (an app gets `#stackra/commands` like a service once it has a command)
- **Services touched**: `services/example` (the demo: it runs its aggregated commands, SC-003)
- **Packages touched**: packages/developer/gen (the collector, the manifest section, the console entry);
  packages/foundation/contracts (`STACKRA_MANIFEST_SCHEMA`: a `commands` section); packages/developer/cli
  (`stackra console <member>`); then, one change each, packages/data/database, packages/runtime/cache,
  packages/runtime/queue, packages/security/tenancy (the first commands)
- **Cross-service events**: none
- **Tenancy and data**: the tenancy and database commands act on data; each runs through the module's own services
  with the operator's actor, never raw SQL around the tenancy layer (`.agents/rules/tenancy.md`)
- **Secrets**: none; a command reads connection settings through the member's `Config` classes, never a value on argv
- **ADR needed**: no new record. ADR 0506 already decides the group, the registry and the refusal; this spec adds an
  implementation note to 0506 (the manifest section and the console entry) when it lands
- **New dependencies**: none (a package that ships commands adds `@stackra/console` as `workspace:*`)
- **Deploy modes**: same everywhere (the console entry runs where the member's code runs; nothing new is deployed)
- **Licence tier**: free
- **Docs to update**: the console guide (`apps/docs/src/docs/guides/console.mdx`: a "Commands from packages" section);
  each package README that ships commands; ADR 0506 implementation note
- **Lane**: full
- **Change risk**: R2 (gen emits a new file and a new entry; no runtime path of a service changes unless its console
  is run)

## Users

- **Package author**: puts `db-migrate.command.ts` in `src/node/commands/`, exports it from `./node`, and every member
  that hosts the package gets `db:migrate`.
- **Member owner** (a service or app): runs `pnpm console db:migrate` (or `stackra console <member> db:migrate`) and
  sees its own commands and its hosted packages' in one list.
- **Operator and CI**: the same flags, exit codes and `--json` as phase 1.

## Requirements

### Collecting

- **FR-001** THE gen SHALL recognise a class that extends `Command({ ... })` from `@stackra/console` as the `command`
  kind, in a module's `commands/` group, a package's `src/node/commands/` and an app's `src/commands/` (ADR 0506
  decision 4), and SHALL refuse one elsewhere with `kind_path` naming the file.
- **FR-002** THE gen SHALL record each command in the member's `stackra.manifest.json` under `commands`, one row per
  class: `name`, `aliases`, `hidden`, `class`, `file`, the `entry` that exports it, and `module` where it sits in one.
- **FR-003** WHERE a member hosts packages (their committed manifests are read through `readDependencyManifests`),
  THE gen SHALL merge each package's `commands` rows into the member's manifest marked `from: <package>`, as it does
  for the other `MERGED_SECTIONS` (STA-1712), own rows first.
- **FR-004** THE gen SHALL take into a package's contributed `commands` only the classes under `src/node/` (the
  `./node` entry); WHERE a command declares `Command({ ..., bin: true })` (a package's own bin command, such as
  `@stackra/console`'s `create` and `demo`), THE gen SHALL record it with `bin: true` and SHALL NOT merge it into a
  host.
- **FR-005** IF two rows in a member's merged `commands` share a name or an alias, THEN THE gen SHALL fail with
  `command_collision`, naming the name and both classes with their packages or files, and SHALL write nothing.
- **FR-006** THE gen SHALL write `.stackra/gen/commands.ts` (imported as `#stackra/commands`): one static import per
  row (a hosted package's from `<package>/node`, the member's own from its file) and `export const COMMANDS` in
  manifest order; WHERE a member has no rows, THE gen SHALL write no file.
- **FR-007** THE gen SHALL list every command class as a wiring binding in `.stackra/gen/wiring.ts`, so the container
  builds it with its constructor collaborators (ADR 0294 decision 17, ADR 0506 decision 2).

### Running

- **FR-008** WHERE a member has `#stackra/commands`, THE gen SHALL write `.stackra/entry/console.ts` that calls
  `createConsole({ name, version, theme, commands: COMMANDS, container })`, with the container built from the
  member's generated wiring and its `Config` classes, and SHALL add a `console` script to the member's generated
  scripts (ADR 0295).
- **FR-009** WHEN an operator runs `stackra console <member> [args]`, THE CLI SHALL run that member's console entry
  with `args`, and SHALL exit with its exit code; IF the member has no console entry, THEN THE CLI SHALL exit 2 and
  say so.
- **FR-010** THE console entry SHALL create the container only when a command is dispatched (phase 1 FR-013), so
  `--help`, the list and `--version` work without a database or a network.

### The inventory and the first commands

- **FR-011** THE spec SHALL carry an inventory (below) of the commands each package should expose and of the
  `stackra` `COMMANDS` entries whose behaviour belongs to a package, for the leader and owner to review before any
  package beyond the first set is changed.
- **FR-012** THE first set SHALL ship, each in its own package's `src/node/commands/`, with tests through
  `runCommandForTest`: database (`db:migrate`, `db:rollback`, `db:status`, `db:seed`), cache (`cache:clear`), queue
  (`queue:work`, `queue:failed`, `queue:retry`), tenancy (`tenant:list`, `tenant:create`).
- **FR-013** A destructive command (`db:rollback`, `cache:clear`, `queue:retry --all`) SHALL ask for confirmation
  when interactive, and SHALL require `--force` otherwise; IF neither is given, THEN it SHALL exit 2 naming `--force`.
- **FR-014** WHERE the `stackra` CLI already has a command whose behaviour a package now owns (`db migrate`,
  `db rollback`, `search reindex`, `search status`, `seed pack`, `settings apply`, `settings diff`), THE CLI SHALL keep
  its name and output in this spec (ADR 0500 decision 7); moving each one is a follow-up per package (Q4).

### Audit

- **FR-015** WHERE a command declares `Command({ ..., audit: true })` (every database and tenancy command does), THE
  Console Kernel SHALL resolve the `CommandAudit` port from the container and record one entry per dispatched run:
  the operator (`STACKRA_OPERATOR`, else the login from the environment), the command name, its bound arguments and
  options, the start time, the outcome (`ok`, `failed`, `cancelled`) and the exit code. IF no `CommandAudit` is bound,
  THEN THE Console Kernel SHALL refuse the run with exit code 1 before the handler runs (fail closed).
- **FR-016** THE Console Kernel SHALL write `[redacted]` in an audit entry for the value of an option or argument
  declared `secret: true`, and of one whose name ends in `password`, `secret`, `token`, `key` or `credential`; a
  redacted value SHALL never reach the entry, a log line or `--json`.
- **FR-017** THE `@stackra/access-log` package SHALL provide the `CommandAudit` driver that stores each entry in its
  write-audit store (ADR 0465 decision 4), and `@stackra/console/testing` SHALL provide a memory `CommandAudit` for
  tests.

## Inventory (for review; FR-011)

| Package                     | Commands proposed                                                                 | Today                                                                                             |
| --------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `@stackra/database`         | `db:migrate`, `db:rollback`, `db:status`, `db:seed`, `db:prune`                   | `migrate`, `rollback`, `seedState`, `pruneRecords` functions; `stackra db migrate`, `db rollback` |
| `@stackra/cache`            | `cache:clear`, `cache:forget <key>`                                               | drivers only                                                                                      |
| `@stackra/queue`            | `queue:work`, `queue:drain`, `queue:failed`, `queue:retry`, `queue:flush`         | `drainQueue`, `runJob`                                                                            |
| `@stackra/scheduler`        | `schedule:list`, `schedule:run`, `schedule:work`                                  | drivers only                                                                                      |
| `@stackra/outbox`           | `outbox:status`, `outbox:prune`, `outbox:replay`                                  | `pruneOutbox`                                                                                     |
| `@stackra/tenancy`          | `tenant:list`, `tenant:create`, `tenant:show`, `tenant:run <tenant> -- <command>` | `runAsTenant`                                                                                     |
| `@stackra/search`           | `search:reindex`, `search:status`, `search:reindex-semantic`                      | `reindexSearch`, `reindexSemantic`; `stackra search reindex`, `search status`                     |
| `@stackra/workflow`         | `workflow:list`, `workflow:run`, `workflow:retry`                                 | `runWorkflow`                                                                                     |
| `@stackra/settings`         | `settings:apply`, `settings:diff`                                                 | `stackra settings apply`, `settings diff`                                                         |
| `@stackra/data-maintenance` | `data:prune`, `data:anonymise`                                                    | actions                                                                                           |
| `@stackra/ai`               | `ai:tools` (list a member's server and client tools)                              | —                                                                                                 |
| `@stackra/registry`         | `registry:list`                                                                   | —                                                                                                 |
| `@stackra/feature-flags`    | `flag:list`, `flag:set`                                                           | —                                                                                                 |
| `@stackra/entitlements`     | `entitlement:list`                                                                | —                                                                                                 |

A service's own modules add theirs in their `commands/` group (`projection:rebuild` for a module with projections).

## Success criteria

- **SC-001** gen's tests cover FR-001 to FR-007: the `command` kind and its `kind_path` refusal, the manifest rows,
  the merge with `from`, the `./node` export rule, `command_collision` naming both classes, and the golden
  `commands.ts` and `console.ts`.
- **SC-002** Each first-set package's commands pass their tests, including FR-013's `--force` refusal.
- **SC-003** On stackra-f4, `services/example` lists the commands of its hosted packages with `pnpm console`, runs
  `db:status` against its test database, and `--json` prints one document.
- **SC-004** `pnpm verify` is green.

## Clarifications (2026-11-01, the leader)

- **Q1** Every hosted package with a committed manifest whose `./node` entry exports a command contributes; no opt-in
  list (FR-003, FR-004).
- **Q2** A generated `console` script and `stackra console <member>`; no per-service `bin`.
- **Q3** `STACKRA_THEME` for every member's console.
- **Q4** `stackra db migrate` and the other data rows stay in the `stackra` CLI; one follow-up per package moves each.
- **Q5** Commands run as a system actor named after the operator, through the tenancy services; `tenant:run` wraps a
  command in `runAsTenant`. Every database and tenancy command is audited (FR-015 to FR-017), and the
  security-tenancy-reviewer sees them before they merge.

## Delivered differently, and follow-ups (2026-11-01)

- `cache:clear` has no `--store` (the cache has one store per process) and `cache:forget` is not shipped (a command
  string cannot make a branded `CacheKey` safely). The `Cache` port gained `flush()`.
- `db:seed` reports a pack's ledger (`seedState`) and writes nothing; writing needs the planner `stackra seed-pack`
  computes, which stays in the CLI until Q4's follow-up moves it.
- `queue:work` needs the host to have connected `QueueWorkerService`; nothing wires that for a console yet.
- The database commands take their environment from `STACKRA_ENVIRONMENT` and refuse a `--env` that contradicts it
  (security review B2). `ready()` on `CommandAudit` refuses a run before its handler when the sink cannot write
  (review B1); a run whose entry fails says it was not audited (S1); an interrupted audited run is recorded after its
  handler settles, up to 30 seconds (S2); a secret value is never echoed in a usage error (S3).
- Command audit entries go in the chain of an operations tenant named by `STACKRA_COMMAND_AUDIT_SCOPE`, because
  `AuditLogEntry` is tenant-owned. Follow-ups for the owner: (S4) refuse a scope the registry does not mark as the
  platform operations tenant, or give the write audit a platform-scope chain (data-engineer); (S5) pass the operator
  as an actor into `TenantDirectory`, and require a break-glass grant for audited commands in production (ADR 0188
  SC12). Consider: audit `queue:retry` and `cache:clear` too (C2); move `MemoryTenantDirectoryDriver` to `./testing`
  (C4).

## Out of scope

- Changing phase 1's kernel, look or harness (only bug fixes found here).
- Commands for packages outside the first set (they follow the reviewed inventory, one change each).
- Shell completion, a REPL, command events and middleware.
- Anything in figentra/flow.

## Status history

- 2026-11-01 · — → Draft · Claude (builder) · drafted from STA-1731 and ADR 0506 after the leader's go-ahead; Q1 to Q5
  sent to the leader
- 2026-11-01 · Draft → Clarified · Claude (builder) · the leader approved Q1 to Q5 as recommended and added the
  audit entry (FR-015 to FR-017)
