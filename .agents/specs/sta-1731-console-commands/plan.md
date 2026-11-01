# Implementation Plan: console commands contributed by packages

**Spec**: [spec.md](./spec.md) · **Linear**: STA-1731 · **Status**: Planned (spec clarified by the leader, 2026-11-01)

## Summary

gen learns the `command` kind, records it in the manifest, merges hosted packages' commands into each member, refuses
collisions, and writes `#stackra/commands` and a console entry. `@stackra/console` gains the audit hook (`audit: true`,
the `CommandAudit` port, redaction), `@stackra/access-log` its driver, and four packages ship the first commands. The
branch stacks on STA-1730 (`figentra/sta-1730-console-port`) and lands after it.

## Work packages (each a commit; disjoint files)

### A. Console: audit and bin flags (`packages/developer/console`)

- `CommandOptions`: `audit?: boolean`, `bin?: boolean`; `CommandStructure` carries both. `ArgumentOptions` and
  `OptionOptions`: `secret?: boolean`; `CommandField.secret`.
- `src/contracts/ports/command-audit.port.ts` (`CommandAudit extends Port`, `record(entry)`), and
  `src/contracts/types/command-audit-entry.type.ts`.
- `src/core/functions/audit-values.function.ts` with `SECRET_FIELD_SUFFIXES`: values by flag, secrets `[redacted]`.
- `runCommand`: for an audited command, after the container is created, `container.has(CommandAudit)` or fail with
  `CommandAuditMissingError` (exit 1) before `handle`; record one entry after the outcome; a failed record turns a
  success into exit 1. `ConsoleContainer` gains optional `has`. The operator is `STACKRA_OPERATOR`, else `USER`,
  `LOGNAME`, `USERNAME`, else `unknown`.
- `@stackra/console/testing`: `MemoryCommandAudit` and `runCommandForTest(..., { audit })`, which serves it from a
  container stand-in.
- `create` and `demo` get `bin: true`. Tests: audited run recorded, refused with no binding, redaction by flag and by
  name, cancelled outcome.

### B. gen and contracts (`packages/developer/gen`, `packages/foundation/contracts`, `packages/developer/coding-standard`)

- `KIND_BASES` gets `Command: "command"` (gen and coding-standard, whose parity test checks both); `KIND_FILES` gets
  `command: { file: "command", suffix: "Command" }`.
- `commandsOf(ir)` modelled on `reportsOf` (ADR 0470): own rows `{ name, aliases, hidden, audit, bin, class, file,
entry, module? }`, `kind_path` when a command is outside `commands/` under a module, `src/node/` or an app's `src/`.
- Hosted rows from dependency manifests, `bin: true` rows dropped, marked `from`; not added to `MERGED_SECTIONS` (that
  array writes `[]` into every manifest), so `commands` is written only when non-empty and no committed manifest
  changes except members that now have commands.
- `command_collision` on the merged names and aliases, naming both classes and their package or file.
- `StackraManifest.commands?` and `STACKRA_MANIFEST_SCHEMA`.
- Emit `.stackra/gen/commands.ts` (optional file list), `.stackra/entry/console.ts` beside `emitRuntimeEntries`, the
  wiring bindings in `emit-wiring`, and the `console` script.
- `stackra console <member> [args]` in `packages/developer/cli`.

### C. Audit driver (`packages/security/access-log`)

- `AuditTrailCommandAuditDriver extends Driver(CommandAudit)`: maps an entry to the write-audit store
  (`PostgresAuditTrailDriver`'s table) as a platform-scope record with the operator as actor, `command` as the key and
  the redacted values as fields. Adds `@stackra/console` (`workspace:*`). Test with the memory database used by the
  package's other driver tests.

### D. First commands (one commit per package; each adds `@stackra/console` `workspace:*`)

- `@stackra/database` `src/node/commands/`: `db:migrate`, `db:rollback` (`--force`), `db:status`, `db:seed --pack`;
  all `audit: true`; they call `migrate`, `rollback`, the session state and `seedState`/`applySeed` with `cwd` and
  `--env` (default `STACKRA_ENV`, else `dev`).
- `@stackra/cache`: `cache:clear` (`--force`, optional `--store`), through the cache port's `flush`.
- `@stackra/queue`: `queue:work` (runs `QueueWorkerService` until a signal), `queue:failed`, `queue:retry <id>|--all`
  (`--force` for `--all`), through the queue port.
- `@stackra/tenancy`: `tenant:list`, `tenant:create <name>`, `audit: true`, through a new `TenantDirectory` port
  (`list()`, `create(draft)`) in `src/core/ports/` that the host's tenant registry implements (the OS tenancy
  service, as for `TenantPlacement`), with `MemoryTenantDirectoryDriver` for tests. No raw SQL.
- Destructive commands confirm when interactive and require `--force` otherwise (FR-013).

### E. Demo and verification

- `services/example`: depends on `@stackra/database` (already) and gets `pnpm console`; SC-003 on a box.
- Each package: typecheck and test on a box; then `stackra gen --manifests` on a box and commit the manifests that
  changed. Security review (security-tenancy-reviewer) on C and D's database and tenancy commands.

## Order

A first (the kind options B reads and the port C and D use), B in parallel, then C and D, then E.

## Risks

- A package that adds `@stackra/console` must not create a cycle: `@stackra/console` depends only on container,
  contracts and validation, so none is possible.
- gen's golden tests may need new fixtures; manifests regenerated on a box only.
