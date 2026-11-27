# Feature Specification: the day-one stackra commands are native console commands that ask, explain and answer --json

**Feature Branch**: `figentra/sta-2883-native-commands`

**Created**: 2026-11-26

**Status**: Implementing <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: feature

**Approver**: leader

**Linear**: STA-2883

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: STA-2883 (production-readiness audit item DX1.2, a sub-issue of STA-2796). The first commands an outside
developer runs (`stackra new`, `gen`, `dev`, `test`, `check`, `verify`, `console`, `db seed`, `db diff` and the rest
still on the old parser) were passthrough commands (`legacyCommand`): they never asked for what they needed, their help
was one usage line, and they had no `--json`. `stackra new service x` stopped and asked for flags instead of asking the
question.

### Sources

- `packages/developer/cli/src/node/functions/legacy-command.function.ts` and `constants/commands.constant.ts` on the
  STA-2872 branch (23 `CliCommand`s wrapped as `passthrough: true` console commands)
- `packages/developer/console/src/core/functions/ask-missing.function.ts`, `parse-invocation.function.ts`,
  `create-console.function.ts` and `testing/functions/passthrough-commands.function.ts` (the console's field parsing,
  prompts, `--json` document and the migration list)
- ADR 0506 (`@stackra/console` is the command kernel), ADR 0500 decision 7 (passthrough is migration only; a moved
  command keeps its output), ADR 0282 decisions 3 and 5 (the `stackra` binary; the local MCP runs the same commands),
  ADR 0529 decision 4 (`stackra runway` mounts Runway's console), STA-1730 spec FR-023 (a prompt without a terminal
  exits 2 naming the option)
- FR-001 to FR-007: the branch's diff and its tests (`commands.constant.test.ts`, `run-cli.function.test.ts`,
  `run-body.function.test.ts`, `new.command.test.ts`, `gen.command.test.ts`, `dev-command.constant.test.ts`)

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/developer/cli (23 command classes under `src/node/commands/`, `runBody`, `askNew`,
  `newKinds`, `currentCliRuntime`, `CLI_RUNTIME_STORE`, `PIPED_RUNTIME`, `runCli`, `runGen`, `GEN_COMMAND`, the
  `CliCommand` / `CliContext` / `CliRuntime` / `GenOutcome` / `NewAnswers` types, its manifest), packages/developer/console
  (`parseInvocation` reads a boolean named `no-<x>` beside an option `<x>` as itself)
- **Public contract change**: `@stackra/cli` (0.x, minor). Removed: `legacyCommand` and `CliCommand.group` / `hidden`
  (added by STA-2872, never released; a command's group and hidden flag live on its class). Added: the command classes,
  `runBody`, `askNew`, `newKinds`, `currentCliRuntime`, `CLI_RUNTIME_STORE`, `PIPED_RUNTIME`, the types `CliRuntime`,
  `GenOutcome`, `NewAnswers`, optional `CliContext.report`, and `runGen`'s optional `onOutcome`. Every command keeps its
  name, options, exit codes and text output; each gains `--help` with its fields and `--json`. A template kind of
  `stackra new` without `--description` or `--summary` now exits 2 naming the flag (it exited 1).
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none. `stackra new` reads the folder names under `packages/` to offer categories; no
  answer is stored.
- **Secrets**: none
- **ADR needed**: no (implements ADR 0506 and ADR 0500 decision 7 as written)
- **New dependencies**: none
- **Deploy modes**: same in all three (a developer tool)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none (terminal output only)
- **Docs to update**: `packages/developer/cli/README.md` (intro and "Help, questions and --json"),
  `apps/docs/src/docs/cli.mdx` and `apps/docs/src/docs/cli.ar.mdx` (one paragraph each), a minor changeset for
  `@stackra/cli`
- **Lane**: full (every day-one command's parser changes, and `stackra new` gains prompts)
- **Change risk**: R2 (the parser of the most used commands; mitigated by the field-parity test and byte-identical
  bodies)

## Glossary _(full lane)_

- **Body**: the `CliCommand` that does a command's work (`GEN_COMMAND`, `NEW_COMMAND`, …), unchanged by this item.
- **Command class**: the `@stackra/console` class that declares a body's arguments and options and runs it
  (`runBody`); its static `body` names the body.
- **Runtime**: whether a command's tools may take the terminal (the binary yes, an MCP capture no) and how it runs
  another `stackra` line; `runCli` holds it for its run (`CLI_RUNTIME_STORE`).
- **Template kind**: a `stackra new` kind rendered from `tools/scaffold/templates` (`tooling`, `app:*`, a package with
  `--entries` or `--data`); it needs a description and a summary.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A newcomer creates a member without knowing the flags (Priority: P1)

An outside developer runs `stackra new` in a terminal. The CLI asks what to create (a list), its name, then what that
kind needs (a service's API area, a package's category from the folders that exist, a template's description and
summary), and writes the member.

**Why this priority**: `stackra new service x` refusing with a wall of flags is the first error a newcomer meets.

**Independent Test**: run `NewCommand` through the console's test runner with scripted answers in a temp workspace.

**Acceptance Scenarios**:

1. **Given** a workspace, **When** `stackra new` runs in a terminal and the answers are service, billing, admin,
   **Then** `services/billing` is written with area admin and the questions were the kind, the name and the area.
2. **Given** `stackra new package loyalty-kit`, **When** it runs in a terminal, **Then** only the category is asked.
3. **Given** no terminal, **When** `stackra new service billing` runs, **Then** it asks nothing and exits 2 naming
   `--area`.

---

### User Story 2 - Every day-one command explains itself (Priority: P1)

**Acceptance Scenarios**:

1. **Given** any ported command, **When** `stackra <command> --help` runs, **Then** each argument and option is listed
   with a description, and the command does not run.
2. **Given** an unknown option or a bad choice, **When** the command runs, **Then** it exits 2 before its body runs.

---

### User Story 3 - Scripts and agents read --json (Priority: P2)

**Acceptance Scenarios**:

1. **Given** a member with a gen refusal, **When** `stackra gen --check --json` runs, **Then** standard output holds one
   document listing the refusal with its member, code, file, line, column, subject, message and fix, and exit is 1.
2. **Given** any other ported command, **When** it runs with `--json`, **Then** standard output holds one document: the
   data the body reports, else its own JSON output, else its exit code and output lines; its text goes to standard
   error.

---

### Edge Cases

- **EC-01**: A body that prints JSON only on success (`db diff`, `testbed status`) prints text on a failure; `--json`
  then reports the exit code and lines instead of failing to parse.
- **EC-02**: `--json` and `--no-interaction` never prompt; a template kind then exits 2 naming `--description`, then
  `--summary`.
- **EC-03**: A flag on by default (`testbed --no-wait`) is given by its negation and reaches the body under its old
  name.
- **EC-04**: A preset command (`verify`, `code:fix`) keeps its preset when the flag is not given.
- **EC-05**: The local MCP runs the same classes with a capture, so a tool never takes its terminal.
- **EC-06**: `stackra runway` stays a mounted console (ADR 0529 decision 4), the one passthrough by design.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE `stackra` binary SHALL register every command as a native console command class, and
  `passthroughCommands(COMMANDS)` SHALL hold `runway` alone; each ported class SHALL run its body unchanged with the
  options, positionals and tokens after `--` the line gives.
- **FR-002**: EACH ported command SHALL declare every option its body reads as a described field, so `--help` lists it
  and the console refuses an unknown option or a bad choice with exit 2.
- **FR-003**: WHEN `stackra new` runs in a terminal THE CLI SHALL ask, in order, what the line left out of the kind, the
  name, a service's area, a package's category and a template kind's description and summary, and never ask what the
  line gave.
- **FR-004**: WHEN `stackra new` runs without a terminal THE CLI SHALL ask nothing and exit 2 naming what to pass.
- **FR-005**: WHEN a ported command runs with `--json` THE CLI SHALL write one document on standard output whose data
  is what the body reports, else its JSON output read back, else its exit code and output lines, and SHALL move the
  body's text to standard error and keep its tools off the terminal. The check commands report their phases and
  findings, whatever `--format` says.
- **FR-006**: WHEN `stackra gen` runs with `--json` THE CLI SHALL report each member's outcome, every refusal and
  warning with member, code, file (from the working directory), line, column, subject, message and fix, the members
  skipped and the launch files.
- **FR-007**: WITHOUT `--json` THE ported commands SHALL print byte-identical text and keep their exit codes (0, 1, 2
  for a usage error with the body's usage as the hint), and a body's tools SHALL take the terminal only when the caller
  has one.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN `stackra new` runs in a terminal with no arguments THE CLI SHALL ask the kind first.
- **AC-002**: IF `stackra new service x` runs without a terminal THEN THE CLI SHALL exit 2 naming `--area`.
- **AC-003**: WHEN `stackra gen --check --json` meets a refusal THE CLI SHALL list it with code, file, line and fix.
- **AC-004**: IF a body reads an option its class does not declare THEN THE commands test SHALL fail.
- **AC-005**: IF a command is registered as passthrough (other than `runway`) THEN THE run-cli test SHALL fail.
- **AC-006**: WHEN `stackra check --json` (or `validate`, `verify`, `code:check`, `code:fix`) runs THE CLI SHALL report
  `{ phases, findings }`: each phase's status, finding and fixable counts and duration, and every finding.
- **AC-007**: WHEN `stackra dev --help` or `stackra build --help` runs THE CLI SHALL describe `--os` as a template
  checkout, and the help of both SHALL name no Figentra product or repository.

## Success Criteria _(mandatory)_

- **SC-001**: `new.command.test.ts` proves FR-003, FR-004, AC-001 and AC-002 and fails with `askNew` bypassed;
  `gen.command.test.ts` proves FR-006 and AC-003 and fails without `context.report` — verified by: unit
- **SC-002**: `commands.constant.test.ts` and `run-cli.function.test.ts` prove FR-001, FR-002, FR-007, AC-004 and
  AC-005 and fail with `commands.constant.ts` and `run-cli.function.ts` back on `legacyCommand`;
  `run-body.function.test.ts` proves FR-005; `check.command.test.ts` and `run-check.function.test.ts` prove AC-006 and
  fail without `runCheck`'s report — verified by: unit
- **SC-003**: the built binary asks in a pseudo-terminal, refuses without one and answers `gen --check --json` on a real
  member; the `@stackra/cli` tests, typecheck, oxlint, oxfmt and `gen --check` pass — verified by: manual

## Compatibility and migration

- Every command keeps its name, options, exit codes and text; scripts and CI are unaffected, except that an unknown
  option was already refused and tokens after `--` to a command that takes none are now refused rather than dropped.
- `stackra new app:* x` without `--description` exits 2 instead of 1.
- Code that imported `legacyCommand` or set `CliCommand.group` (only the unreleased STA-2872 branch) uses a command
  class.
- **Behaviour change**: `stackra dev --infra <name>[,<name>]` (STA-2664, on main since stackra#1141) is now
  `stackra dev --opt-in <name>[,<name>]`. A command may not declare both `--<x>` and `--no-<x>`, and `--no-infra` (the
  flag the Docker error tells people to use) stays, so the opt-in list takes the other name. A script that passed
  `--infra` passes `--opt-in`.

## Risks

- **R-1**: A class drifts from its body's options. Mitigated by the parity test: every option a body reads must be a
  described field, and a run with every field given must reach the body.
- **R-2**: `--quiet`, `--json` and the other console globals now belong to the console. Mitigated: no body read them
  except `db diff --json` and `testbed --json`, which the classes hand on.

## Out of scope

- Rewriting the bodies as console-native output (tables, `io.output`); they stay byte-identical (ADR 0500 decision 7).
- Prompts for commands other than `stackra new` (their required inputs are flags with defaults).
- STA-2855's `stackra new` generators (module, model, …): its kinds appear in the prompt from the body's usage.

## Assumptions

- The console's `runCommandForTest` answers prompts as a terminal would.
- `node:async_hooks` is available wherever `stackra` runs (Node 24).

## Open questions

None.

## Amendments

- 2026-11-26 · review of the branch: `check --json` returned only the captured text lines, though the README and the
  check classes promised the phases and findings. Added AC-006, P-008 and T010: `runCheck` reports `{ phases,
findings }` and `validate --repository` `{ findings: [{ dir, text }] }`; FR-005 names the check commands.
- 2026-11-27 · CTO review condition: the `--os` help of `dev` and `build` is neutral ("the template checkout"), and
  their examples use `../template`, so the public help names no Figentra product. Added AC-007 and T011.
- 2026-11-27 · main's dev compose flags (`stackra dev --infra <names>` and `--no-infra`, STA-2664) arrived after the
  port: `DevCommand` declares both, and the console's `parseInvocation` reads `--no-infra` as its own boolean, where
  `node:util.parseArgs` would read it as the negation of `--infra`. Added T012.

- 2026-11-27 · CTO ruling on the duplication of the check presets: no baseline raise. `check`, `validate`, `verify`,
  `code:check` and `code:fix` take their eight shared flags from one `CheckOptionSet` with `@Options` (STA-2924,
  stackra#1208), and `runCheckPreset` runs a preset's body with them. Narrowed the `--no-<x>` parse: it is read as its
  own flag only when a boolean declares `no-<x>`, any other `--no-<x>` still negates `--<x>`, and declaring both is a
  declaration error, so `stackra dev`'s opt-in list is `--opt-in`. Added T013 and T014.

## Status history

- 2026-11-26 · — → Draft · Claude (STA-2883 session) · created from audit item DX1.2
- 2026-11-26 · Draft → Clarified · Claude (STA-2883 session) · bodies stay, classes declare fields, runtime per run
- 2026-11-26 · Clarified → Planned · Claude (STA-2883 session) · plan.md
- 2026-11-27 → Planned (plan.md) — Approved by Idris (CTO) 2026-11-27
- 2026-11-26 · Planned → Tasked · Claude (STA-2883 session) · tasks.md
- 2026-11-26 · Tasked → Implementing · Claude (STA-2883 session) · T001 to T009 on the branch
