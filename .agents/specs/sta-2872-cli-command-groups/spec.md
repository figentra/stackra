# Feature Specification: the stackra command list is grouped and short, with the core-repository checks hidden

**Feature Branch**: `figentra/sta-2872-cli-command-groups`

**Created**: 2026-11-26

**Status**: Implementing <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: feature

**Approver**: leader

**Linear**: STA-2872

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: STA-2872 (production-readiness audit item DX1.1, a sub-issue of STA-2796). The first `stackra` an outside
developer runs printed about 60 commands, sorted by namespace with no headings for most of them, and about half were
checks only the Stackra core repository runs (structure, cycles, duplication, doc-standard, the testbed, the consumer
gate, …). An app team never runs them, and they buried the commands a newcomer needs.

### Sources

- `packages/developer/cli/src/node/constants/commands.constant.ts` on `main` (no command named a `group`)
- `packages/developer/console/src/core/functions/render-list.function.ts` and `create-console.function.ts` on `main`
  (headings sorted alphabetically; only `hidden` left a command out)
- The Stackra template's minimal profile (`stackra.starter.yaml`, `starter/minimal/root-runway.yaml`): the workspace
  `stackra create` writes for an outside developer
- ADR 0282 decision 3 (the `stackra` binary and its commands), ADR 0506 (`@stackra/console` is the command kernel),
  ADR 0083 (the binary's name)
- FR-001 to FR-003: the branch's diff against `main` and its tests (`command-list.test.ts`, `route.function.test.ts`,
  `commands.constant.test.ts`, `unlisted-command.function.test.ts`, `is-core-repository.function.test.ts`,
  `workspace-fits.function.test.ts`)

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/developer/console (`ConsoleConfig`, the `Renderer` port's `commandList`, the route
  decision, the list and completion), packages/developer/cli (every command's `group`, `CliCommand`, the listing rules,
  `runCli`)
- **Public contract change**: additive. `@stackra/console`: `ConsoleConfig` gains optional `groups` (heading order) and
  `unlisted` (a per-run test that leaves a command out of the list and tab completion); `Renderer.commandList` takes an
  optional third argument, `CommandListOptions` (`order`, `more`), exported from `@stackra/console/contracts`; the
  built-in `list` command (`list`, `list --all`) answers when no registered command is named `list`. `@stackra/cli`:
  `CliCommand` gains optional `group` and `hidden`; the manifest marks `agents:check`, `agents:sync` and `mcp:sync`
  hidden. No export, command name or option is removed or renamed, and every command still runs by name.
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none. The CLI reads the workspace's own package.json files, root `runway.yaml` and whether
  `seed-packs/` exists, only when it lists or completes commands.
- **Secrets**: none
- **ADR needed**: no (implements ADR 0282 decision 3 and ADR 0506 as written; the list shape stays Symfony's, spec 030
  Requirement 5.2)
- **New dependencies**: none
- **Deploy modes**: same in all three (a developer tool)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none (terminal output only)
- **Docs to update**: `packages/developer/cli/README.md` ("The command list"), `apps/docs/src/docs/cli.mdx` and
  `apps/docs/src/docs/cli.ar.mdx` (one paragraph each), a minor changeset for `@stackra/console` and `@stackra/cli`
- **Lane**: full (a public option on the console kernel and a visible change to the first screen of the CLI)
- **Change risk**: R1 (output of `stackra` with no command and of tab completion; no command's behaviour changes)

## Glossary _(full lane)_

- **Heading**: the line a command sits under in the list: its `group`, else its namespace (`db` of `db:migrate`).
- **Hidden**: a command declared `hidden: true`; the list never shows it without `--all`.
- **Unlisted**: a command `ConsoleConfig.unlisted` names for this run; listed and completed as a hidden one is.
- **Core repository**: the workspace whose members include `@stackra/cli` (the repository that builds the binary).
- **Fit**: what a workspace must have for the list to show a command that only some workspaces use (`COMMAND_FITS`).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A newcomer reads the list (Priority: P1)

An outside developer runs `stackra create acme`, then `stackra` in the new app. They see at most 25 commands under the
headings Create, Develop, Inspect, Database, Quality and Deploy, in that order, and a last line that `stackra list --all`
shows the rest.

**Why this priority**: the first screen decides whether the tool reads as approachable.

**Independent Test**: write the minimal-profile workspace to a temp folder and run `runCli` there.

**Acceptance Scenarios**:

1. **Given** the minimal app, **When** `stackra --json` runs, **Then** the data holds exactly the 25 commands the app
   uses and no Repository check.
2. **Given** the minimal app, **When** `stackra` runs in `services/example`, **Then** the headings are the groups in
   order without Repository, and the hint names `stackra list --all`.

---

### User Story 2 - Every command is still there (Priority: P1)

**Acceptance Scenarios**:

1. **Given** any workspace, **When** `stackra list --all` runs, **Then** every command is listed, the hidden ones too.
2. **Given** an app, **When** `stackra structure --help` runs, **Then** the Repository command answers.

---

### User Story 3 - The list follows what the workspace uses (Priority: P2)

**Acceptance Scenarios**:

1. **Given** a root runway with surfaces and a mobile app, **Then** smoke, preview serve and mobile onboard are listed.
2. **Given** a member that depends on `@stackra/search`, `@stackra/settings` and `@stackra/audit`, and a `seed-packs/`
   folder, **Then** their commands are listed.
3. **Given** the core repository, **Then** every group is listed, Repository included.

---

### Edge Cases

- **EC-01**: A workspace whose package.json does not parse lists as an app with none of the fits; the list never fails.
- **EC-02**: A console that registers its own `list` command keeps it; the built-in answers only otherwise.
- **EC-03**: `list` with an argument or an unknown option is a usage error (exit 2).
- **EC-04**: The workspace is read on the first listing question only; a run that dispatches a command reads nothing.
- **EC-05**: Outside any pnpm workspace the CLI's folder is the root; with no manifests it lists as an app.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE console's command list SHALL draw commands under no heading first, then the headings
  `ConsoleConfig.groups` names in that order, then any other heading alphabetically; AND every `stackra` command SHALL
  name one of `COMMAND_GROUPS` (Create, Develop, Inspect, Database, Quality, Deploy, Repository) as its `group`.
- **FR-002**: WHERE `ConsoleConfig.unlisted` names a command THE console SHALL leave it out of the list, its `--json`
  data and tab completion while still running it by name; AND `stackra` SHALL leave out the Repository group outside
  the core repository, each `COMMAND_FITS` command whose fit the workspace lacks, and the hidden check presets and
  plumbing commands.
- **FR-003**: WHEN `list` runs and no registered command takes that name THE console SHALL print the command list, and
  with `--all` every command (hidden and unlisted included); a list that left commands out SHALL end with a line naming
  `list --all` and the count it adds.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN `stackra` runs in the minimal app THE CLI SHALL list at most 25 commands, none of the Repository group.
- **AC-002**: WHEN the list is drawn THE CLI SHALL show the headings in `COMMAND_GROUPS` order.
- **AC-003**: WHEN `stackra list --all` runs THE CLI SHALL list every command of `COMMANDS`.
- **AC-004**: WHILE a command is unlisted or hidden THE CLI SHALL still run it by name.
- **AC-005**: WHERE the workspace builds `@stackra/cli` THE CLI SHALL list the Repository group.
- **AC-006**: IF a command is added without a group THEN THE commands test SHALL fail.

## Success Criteria _(mandatory)_

- **SC-001**: `unlisted-command.function.test.ts` proves AC-001 to AC-005 on fixture workspaces and fails with
  `run-cli.function.ts` reverted; `command-list.test.ts` and `route.function.test.ts` prove FR-001 to FR-003 in the
  console and fail with its list code reverted — verified by: unit
- **SC-002**: `commands.constant.test.ts` proves AC-006, the Repository set and the hidden set — verified by: unit
- **SC-003**: the `@stackra/console` and `@stackra/cli` tests, typecheck, oxlint and oxfmt pass — verified by: manual

## Compatibility and migration

- Every command keeps its name, options and exit codes; scripts and CI that call `stackra validate`, `verify`,
  `code:check`, `mcp sync` or a Repository check are unaffected.
- `stackra` with no command shows fewer commands; `stackra list --all` shows the old full set.
- A console built on `@stackra/console` without `groups` or `unlisted` lists exactly as before, plus the `list` built-in
  when it has no `list` command of its own. A custom `Renderer` that ignores the new third argument keeps working.

## Risks

- **R-1**: A developer looks for a hidden command in the list. Mitigated by the last line naming `list --all` with the
  count, by `check`'s description naming its presets, and by the README section.
- **R-2**: A fit rule hides a command a workspace does use (for example a package re-exported under another name).
  Mitigated: it still runs by name, `list --all` shows it, and the rules are one table (`COMMAND_FITS`).

## Out of scope

- The other DX1 items (prompting for missing input, explaining errors).
- Collapsing namespaces (`db`) into one row.

## Assumptions

- The minimal profile of the template is the workspace an outside developer starts from.
- `@stackra/cli` as a workspace member identifies the core repository.

## Open questions

None.

## Amendments

None.

## Status history

- 2026-11-26 · — → Draft · Claude (STA-2872 session) · created from audit item DX1.1
- 2026-11-26 · Draft → Clarified · Claude (STA-2872 session) · groups, hiding rules and the 25-command target settled
- 2026-11-26 · Clarified → Planned · Claude (STA-2872 session) · plan.md
- 2026-11-26 · Planned → Tasked · Claude (STA-2872 session) · tasks.md
- 2026-11-26 · Tasked → Implementing · Claude (STA-2872 session) · T001 to T010 on the branch
