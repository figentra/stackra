# Feature Specification: run a member's own commands at the top level

**Feature Branch**: `figentra/sta-2888-member-commands-top-level`

**Created**: 2026-11-27

**Status**: Implementing

**Tier**: small

**Approver**: leader

**Linear**: STA-2888

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: Linear STA-2888 (batch DX1, "a CLI a newcomer can read", item DX1.3 of the readiness audit): a member's
console commands hide behind `stackra console <member> <command> -- <flags>`, which Laravel and Nest users will not
guess. Unknown names should look the commands up in the manifests, pick the member or ask for it, list them per
member, and forward the flags without `--`. This spec is written from what was built.

### Sources

- `packages/developer/cli/src/node/constants/console-command.constant.ts` and `run-cli.function.ts` on `main` (the only
  way to run a member command, and the dispatcher)
- `StackraManifest.commands` in `packages/foundation/contracts/src/core/types/stackra-manifest.type.ts` (the rows gen
  writes: name, aliases, hidden, bin, from)
- `packages/developer/gen/src/core/functions/emit-console-entry.function.ts` (no console entry for a package)
- `@stackra/console`: `createConsole`, `readCommand`, `route` (passthrough), `renderList` (`group` headings),
  `findCommand` ("did you mean"), `runCommandForTest` (scripted answers)
- `packages/developer/cli/src/node/commands/runway.command.ts` (a passthrough by design that mounts another console)
- ADR 0506 (decision 6: a member's console; decision 8), ADR 0282 (decision 3: `stackra` runs every operation),
  ADR 0500 (decision 1), ADR 0529 (decision 4), ADR 0502 (tiers)
- Linear STA-2888 (parent STA-2796); open PRs #1170 (STA-2872) and #1177 (STA-2883) touch the same dispatcher
- FR-001 to FR-006: Linear STA-2888 and the readiness audit item DX1.3; FR-007: the created-app proof (`db:status --cwd`
  defaulted to the workspace root); all seven as built in this branch's diff against `main` and its tests
- The proof: the built binary on a copy of a created app (`demo-2840`: `services/example` and `services/orders` host
  `@stackra/database`, `services/example` also `@stackra/queue`)

## Problem

A service, app or worker runs its own console commands and those of the packages it hosts (ADR 0506 decision 6). gen
lists them in the member's committed `stackra.manifest.json` (`commands`) and writes `.stackra/entry/console.ts`. The
only way to run one was `stackra console <member> <command>`, with the command's flags after `--`
(`stackra console example db:status -- --json`), because the CLI parses its own options strictly. `stackra db:status`
answered "The command does not exist", and `stackra` listed none of them. `stackra console` also ran the member's
console in the person's folder, so from the workspace root `db:status --cwd` defaulted to the root, not the member.

## Impact

- **Apps touched**: apps/docs (the console guide)
- **Services touched**: none
- **Packages touched**: packages/developer/cli
- **Public contract change**: none. `@stackra/cli` exports only its binary; the new types are internal. The CLI's
  command surface grows: a name `stackra` does not take may now run a member command.
- **Cross-service events**: none
- **Tenancy and data**: none; the CLI reads committed manifests and `stackra.config.ts` text only
- **Security and privacy**: none; a member command runs as `stackra console` ran it, in the same process
- **Secrets**: none
- **ADR needed**: no; it applies ADR 0506 decision 6 and ADR 0282 decision 3
- **New dependencies**: none
- **Deploy modes**: same in all three (a development-time CLI)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/developer/cli/README.md` (the command table), `apps/docs/src/docs/guides/console.mdx`
  ("Run a service's or app's commands with stackra"), `.changeset/top-level-member-commands.md` (minor for
  `@stackra/cli`)
- **Lane**: feature (one package)
- **Change risk**: R1

## Requirements

### Functional Requirements

- **FR-001**: WHEN a command line names a command that no `stackra` command takes and an app, service or worker of the workspace declares it THE `stackra` CLI SHALL run it in that member's console with every token after the name as typed, less the first lone `--`, and exit with its exit code.
- **FR-002**: WHEN several members declare the command THE CLI SHALL run it in the member whose folder holds the working directory, the deepest one when members nest.
- **FR-003**: IF several members declare the command and the working directory is in none of them THEN THE CLI SHALL ask which member on a terminal, and with no terminal exit 2 naming the members and `stackra console <member> <command>`.
- **FR-004**: THE CLI SHALL NOT let a member command take the name or alias of a `stackra` command or a kernel word, offer a package, or keep an alias another command takes.
- **FR-005**: THE `stackra` command list SHALL show each member command under a heading naming its member or members, with where it comes from and how to see its own options.
- **FR-006**: WHEN the command line names a `stackra` command THE CLI SHALL read no manifest.
- **FR-007**: THE CLI SHALL import and run a member's console, by either form, in the folder the person stands in when it is inside the member, else in the member's root, and put the process's working directory back afterwards.

## Acceptance criteria

- **AC-001**: WHEN `stackra db:status --json` runs in a workspace whose one service declares `db:status` THE CLI SHALL run that service's console with `db:status --json` and exit with its code.
- **AC-002**: WHEN two services declare `db:status` and the person stands in one of them THE CLI SHALL run it there.
- **AC-003**: IF two services declare `db:status` and the run has no terminal THEN THE CLI SHALL exit 2 naming both and `stackra console`.
- **AC-004**: WHILE a terminal is attached THE CLI SHALL ask "Which member runs db:status?" for an ambiguous name.
- **AC-005**: IF a member declares `gen` or `db:migrate` THEN THE CLI SHALL run the `stackra` command of that name.
- **AC-006**: THE command list SHALL show `db:status` under the heading `services/orders`.
- **AC-007**: WHEN `stackra db:status` runs at the workspace root THE CLI SHALL import and run the member's console in the member's root.

## Success Criteria

- **SC-001**: the `read-member-commands`, `host-around`, `is-within`, `member-command`, `top-level-member-commands` and
  `console-command` unit tests and the `runCli` member-command tests prove FR-001 to FR-007 and AC-001 to AC-007, and
  fail with each behaviour reverted — verified by: unit
- **SC-002**: on a created app whose two services host `@stackra/database`, the built binary lists the member commands
  per member, shows `db:status`'s `--cwd` default as the member's folder from the workspace root, runs
  `stackra queue:failed -- --help` as `stackra console example queue:failed -- --help` does, runs `db:status` in the
  service the person stands in, and exits 2 naming both services at the root — verified by: manual
- **SC-003**: the `@stackra/cli` tests, typecheck, oxlint and oxfmt pass — verified by: manual

## Design

### Summary

`runCli` adds the member commands beside its own for the run, as passthrough console commands, so the console's own
list, help, completion and "did you mean" see them; `stackra console` and the top-level form share one runner.

### Architecture overview

`topLevelMemberCommands(argv, cwd, builtins)` returns nothing when the line names a `stackra` command. Otherwise
`readMemberCommands` reads the manifests of the workspace around `cwd` (members whose `stackra.config.ts` calls
`defineApp`, `defineService` or `defineWorker`), one row per name with every host; `memberCommand` turns each row into
a passthrough `Command` class whose `group` is the host label; its `handle` picks the host (`hostAround`, else the
prompt, else a usage error) and calls `runMemberConsole`, which changes to the member's folder for the entry's import
and run and changes back.

### Components and responsibilities

- `readMemberCommands`: the manifests to rows; never throws for a broken manifest or row.
- `hostAround`: the only host, else the deepest host holding `cwd`; `isWithin` places a folder.
- `memberCommand`: the class: name, free aliases, hidden, group, description, examples; forwarding and the pick.
- `topLevelMemberCommands`: the reserved names, the hot-path skip, and dropping a name the console refuses.
- `runMemberConsole`: the entry's import through Vite and its run in the member's folder, shared with
  `CONSOLE_COMMAND`.

### Files and folders

```text
packages/developer/cli/
├── README.md
├── package.json
└── src/node/
    ├── constants/
    │   ├── console-command.constant.ts
    │   └── __tests__/console-command.constant.test.ts
    ├── functions/
    │   ├── host-around.function.ts
    │   ├── is-within.function.ts
    │   ├── member-command.function.ts
    │   ├── read-member-commands.function.ts
    │   ├── run-cli.function.ts
    │   ├── run-member-console.function.ts
    │   ├── top-level-member-commands.function.ts
    │   └── __tests__/
    │       ├── host-around.function.test.ts
    │       ├── is-within.function.test.ts
    │       ├── member-command.function.test.ts
    │       ├── read-member-commands.function.test.ts
    │       ├── run-cli.function.test.ts
    │       └── top-level-member-commands.function.test.ts
    └── types/
        ├── member-command.type.ts
        └── member-command-host.type.ts
apps/docs/src/docs/guides/console.mdx
.changeset/top-level-member-commands.md
```

### Data models and migrations

None.

### Contracts

None public. The internal interfaces:

```typescript
type MemberCommandHost = { readonly root: string; readonly label: string; readonly from?: string };
type MemberCommand = {
  readonly name: string;
  readonly aliases: readonly string[];
  readonly hidden: boolean;
  readonly hosts: readonly MemberCommandHost[];
};
function readMemberCommands(cwd: string, reserved: ReadonlySet<string>): readonly MemberCommand[];
function hostAround(
  hosts: readonly MemberCommandHost[],
  cwd: string,
): MemberCommandHost | undefined;
function isWithin(root: string, folder: string): boolean;
function memberCommand(command: MemberCommand): CommandClass;
function topLevelMemberCommands(
  argv: readonly string[],
  cwd: string,
  builtins: readonly CommandClass[],
): readonly CommandClass[];
function runMemberConsole(
  root: string,
  member: string,
  argv: readonly string[],
  err: (text: string) => void,
  cwd: string,
): Promise<number>;
```

The member console is called as before: `run(argv)` of the generated entry.

### Error handling

An ambiguous name with no terminal is a `UsageError` (exit 2) with the members and the `stackra console` form as its
hint. A member without a console entry exits 2 with the message `stackra console` prints. A broken manifest, row or odd
command name is skipped, so the rest of the CLI keeps working.

### Security and tenancy

None: the member's console runs as `stackra console` ran it; the CLI reads committed files only.

### Testing strategy

Unit tests per function (throwaway workspaces, real Vite-loaded console entries, `runCommandForTest` with scripted
answers for the prompt); `runCli` tests through the real console; a revert check per behaviour; the built binary on a
created app.

### Rollout

Minor changeset for `@stackra/cli`. `stackra console <member>` keeps its form, so no script breaks.

## Tasks

- [x] T001 `MemberCommand` and `MemberCommandHost` in `packages/developer/cli/src/node/types/member-command.type.ts` and `packages/developer/cli/src/node/types/member-command-host.type.ts`, and `readMemberCommands` in `packages/developer/cli/src/node/functions/read-member-commands.function.ts` with its test — covers: FR-004, AC-005
- [x] T002 `isWithin` in `packages/developer/cli/src/node/functions/is-within.function.ts` and `hostAround` in `packages/developer/cli/src/node/functions/host-around.function.ts`, with their tests — covers: FR-002, FR-003, AC-002
- [x] T003 `runMemberConsole` in `packages/developer/cli/src/node/functions/run-member-console.function.ts`, used by `packages/developer/cli/src/node/constants/console-command.constant.ts` (its test covers the folder) — covers: FR-007, AC-007
- [x] T004 `memberCommand` in `packages/developer/cli/src/node/functions/member-command.function.ts` with its test (forwarding, alias, heading, pick, prompt, refusal, no entry, folder) — covers: FR-001, FR-002, FR-003, FR-005, FR-007, AC-001, AC-003, AC-004, AC-007
- [x] T005 `topLevelMemberCommands` in `packages/developer/cli/src/node/functions/top-level-member-commands.function.ts` and the hook in `packages/developer/cli/src/node/functions/run-cli.function.ts`, with their tests — covers: FR-001, FR-004, FR-005, FR-006, AC-001, AC-005, AC-006
- [x] T006 Document the top-level form in `packages/developer/cli/README.md`, `apps/docs/src/docs/guides/console.mdx` and `.changeset/top-level-member-commands.md` — covers: SC-002, AC-001, AC-006
- [x] T007 Run the `@stackra/cli` tests, typecheck, oxlint and oxfmt, and the created-app proof, in `packages/developer/cli/package.json` — covers: SC-001, SC-002, SC-003, AC-001, AC-002, AC-003, AC-005, AC-006, AC-007

## Compatibility and migration

- **Behaviour change (FR-007)**: `stackra console <member> <command>` used to run in the folder it was typed in. It
  now runs in the member's root when you stand outside the member (and in your own folder when you stand inside it).
  A relative path argument typed at the workspace root, such as `--out report.csv`, therefore resolves inside the
  member (`services/orders/report.csv`) instead of where it was typed. To keep the old meaning, pass an absolute path
  (`--out "$PWD/report.csv"`) or run the command from inside the member. Options that default to the current folder
  (`db:status --cwd`) now act on the member from the workspace root, which is the point of the change.
- Every `stackra` command keeps its name, options and exit codes; a member command never shadows one (FR-004).
- A workspace whose members declare no console commands lists the same `stackra` commands as before.

## Out of scope

- A one-line description per member command in the list: the manifest's `commands` rows carry no description, and
  adding one is a gen and `@stackra/contracts` change.
- Showing the member command's own options in `stackra <command> --help` (the outer console keeps `--help` for a
  passthrough command; `-- --help` reaches the command).

## Assumptions

- The committed manifest lists the member's commands (gen writes it; `stackra gen` runs before `stackra dev`, `test`
  and `build`).

## Amendments

- A-001 · 2026-11-27 · the created-app proof: the generated entry reads option defaults when it builds its console on
  import, so the member's folder covers the import as well as the run (FR-007, AC-007)
- A-002 · 2026-11-27 · spec gate (`fflow gate ci`): one-line EARS criteria, `### Sources`, the folder tree and
  interfaces, and every changed file named by a task
- A-003 · 2026-11-27 · CTO review condition: the FR-007 folder change is recorded as a behaviour change
  (Compatibility and migration, the changeset, the console guide and the CLI README), with how to keep the old meaning

## Status history

- 2026-11-27 · — → Draft · Claude (STA-2888, batch DX1) · written from the built change
- 2026-11-27 · Draft → Implementing · Claude (STA-2888, batch DX1) · small tier, no approval stop (ADR 0502 decision 1)
- 2026-11-27 → Planned (plan.md) — Approved by Idris (CTO) 2026-11-27
