# Implementation Plan: the day-one stackra commands are native console commands that ask, explain and answer --json

**Spec**: `.agents/specs/sta-2883-native-commands/spec.md` · **Linear**: STA-2883 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2883-native-commands/spec.md`

## Summary

Each of the 23 passthrough `CliCommand`s gets a `@stackra/console` command class under
`packages/developer/cli/src/node/commands/`. The class names the body (`static body`), declares every option the body
reads as a described `@Option` (and its positionals as `@Argument`s), and its `handle` calls `runBody`, which builds
the body's `CliContext` from the fields (a false or absent flag left out, as `parseArgs` left it), writes the body's
text byte for byte, maps a `CliUsageError` to the body's usage, and under `--json` keeps the body's standard output and
writes the data (`context.report`, else `toData`, else exit code and lines). `NewCommand` first runs `askNew`, which
prompts for what the kind needs in a terminal. `GEN_COMMAND` reports `GenOutcome`s from `runGen`. `runCli` registers
the classes and holds the run's `CliRuntime` in `CLI_RUNTIME_STORE` (an `AsyncLocalStorage`), so classes take no
constructor argument (gen's injection rules) and a nested `context.cli` run gets its own. `legacyCommand` is deleted.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `@stackra/cli` (developer)
- **Testing**: vitest in `src/**/__tests__/`; `@stackra/console/testing`'s `runCommandForTest` with scripted answers
- **Storage**: none
- **Runtime target**: the `stackra` binary on a developer machine and in CI, and the local MCP

## Constitution Check

| Law                                   | Result | Note                                                              |
| ------------------------------------- | ------ | ----------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | the CLI depends on the console, as before; no new edge            |
| Secrets (ADR 0009)                    | N/A    | none                                                              |
| Security                              | PASS   | `askNew` reads folder names under `packages/` only                |
| HTTP and events                       | N/A    | none                                                              |
| Tenancy                               | N/A    | none                                                              |
| Delegation                            | PASS   | Claude only                                                       |
| Not built yet (ADR 0011)              | PASS   | nothing referenced that is not built                              |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                                             |
| Versions and catalogs                 | PASS   | a minor changeset for `@stackra/cli`                              |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                                 |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                         |
| Docs and ADRs                         | PASS   | README section, CLI docs page (English and Arabic); no ADR change |

## Deploy modes

| Mode       | Behaviour                                          |
| ---------- | -------------------------------------------------- |
| SaaS       | the developer's `stackra` runs the native commands |
| On-prem    | the same                                           |
| Air-gapped | the same; prompts and `--json` need no network     |

## Correctness properties

- **P-001**: `passthroughCommands(COMMANDS)` is `["runway"]` and every other command is a class whose `handle` runs its body — Validates: FR-001, AC-005
- **P-002**: for every ported class, each option its body reads is a described field (so `--help` lists it and the console refuses an unknown one with exit 2), and a line giving every field reaches the body with every option defined and its positionals in order — Validates: FR-001, FR-002, AC-004
- **P-003**: `stackra new` in a terminal asks exactly what the line left out (kind, name, area, category, description, summary), in that order, and never what it gave — Validates: FR-003, AC-001
- **P-004**: `stackra new` without a terminal, or under `--json` or `--no-interaction`, asks nothing and exits 2 naming the first missing flag — Validates: FR-004, AC-002
- **P-005**: under `--json` standard output is the document alone, the body's text is on standard error, a tool never inherits the terminal, and the data is the body's report, else its JSON output read back, else its exit code and lines — Validates: FR-005, AC-003, AC-006
- **P-006**: `gen --json` carries each member's outcome and every refusal and warning with member, code, file from the working directory, line, column, subject, message and fix — Validates: FR-006, AC-003
- **P-007**: without `--json` every ported command writes the body's text byte for byte with its exit code, and a `CliUsageError` exits 2 with the body's usage as the hint — Validates: FR-007
- **P-008**: `check`, `verify`, `validate`, `code:check` and `code:fix` under `--json` report `{ phases, findings }` (each phase's status, finding and fixable counts and `durationMs`, every finding) whatever `--format` says; `validate --repository --json` reports `{ findings: [{ dir, text }] }` — Validates: FR-005, AC-006

## Architecture overview

`runCli` builds the `@stackra/console` kernel with the command classes in `COMMANDS` and runs it inside
`CLI_RUNTIME_STORE.run(runtime, …)`: the binary's runtime lets tools inherit the terminal, the local MCP's capture
(`PIPED_RUNTIME`) does not. The console parses the line against the class's fields, refuses an unknown option or a bad
choice with exit 2, prints `--help` from the field descriptions, and prompts for missing input only when it has a
terminal. A class's `handle` hands its fields to `runBody(io, body, input)`, which builds the body's `CliContext`
(values by flag name, a false or absent flag left out as `parseArgs` left it), runs the body unchanged and, under
`--json`, keeps its standard output for the document and shows it on standard error. The data is what the body hands
`context.report` (`runCheck`, `GEN_COMMAND`, `VALIDATE_COMMAND --repository`), else `toData` of the kept output (`db
diff`, `testbed status`), else `{ exitCode, output }`. `NewCommand` runs `askNew` before its body to fill what the line
left out. `context.cli` runs a nested `stackra` line under the same runtime from the store.

## Components and responsibilities

- Command classes (`commands/*.command.ts`, 23 new): declare each body's arguments and options with descriptions,
  group, examples; `static body` names the body; `handle` calls `runBody`.
- `runBody` (`functions/run-body.function.ts`): runs a body from a class; byte-identical text, `--json` data, usage hint.
- `askNew`, `newKinds` (`functions/ask-new.function.ts`, `functions/new-kinds.function.ts`), `NewAnswers`: the
  questions of `stackra new` and the kinds offered, read from the body's usage.
- `CliRuntime`, `CLI_RUNTIME_STORE`, `PIPED_RUNTIME`, `currentCliRuntime`: the run's terminal and nested-run policy,
  per run, without constructor injection.
- `runCli` (`functions/run-cli.function.ts`): registers the classes, runs the console inside the store.
- `runGen`'s `onOutcome`, `GenOutcome`, `GEN_COMMAND`: gen's outcome as `--json` data.
- `runCheck` (`functions/run-check.function.ts`) and `VALIDATE_COMMAND`: report the check phases and findings, and
  the repository findings, as `--json` data.
- `COMMANDS` (`constants/commands.constant.ts`): the registered classes; `legacyCommand` is deleted.

## Files and folders

```text
.changeset/cli-native-commands.md
apps/docs/src/docs/cli.ar.mdx
apps/docs/src/docs/cli.mdx
packages/developer/cli/README.md
packages/developer/cli/package.json
packages/developer/cli/stackra.manifest.json
packages/developer/cli/src/node/commands/
packages/developer/cli/src/node/commands/__tests__/check.command.test.ts
packages/developer/cli/src/node/commands/__tests__/gen.command.test.ts
packages/developer/cli/src/node/commands/__tests__/new.command.test.ts
packages/developer/cli/src/node/commands/build.command.ts
packages/developer/cli/src/node/commands/check.command.ts
packages/developer/cli/src/node/commands/code-check.command.ts
packages/developer/cli/src/node/commands/code-fix.command.ts
packages/developer/cli/src/node/commands/console.command.ts
packages/developer/cli/src/node/commands/db-diff.command.ts
packages/developer/cli/src/node/commands/db-seed.command.ts
packages/developer/cli/src/node/commands/deploy.command.ts
packages/developer/cli/src/node/commands/dev.command.ts
packages/developer/cli/src/node/commands/eas-preflight.command.ts
packages/developer/cli/src/node/commands/gen.command.ts
packages/developer/cli/src/node/commands/lint.command.ts
packages/developer/cli/src/node/commands/mcp-exec.command.ts
packages/developer/cli/src/node/commands/mcp.command.ts
packages/developer/cli/src/node/commands/new.command.ts
packages/developer/cli/src/node/commands/preview-serve.command.ts
packages/developer/cli/src/node/commands/seed-pack.command.ts
packages/developer/cli/src/node/commands/start.command.ts
packages/developer/cli/src/node/commands/test.command.ts
packages/developer/cli/src/node/commands/testbed.command.ts
packages/developer/cli/src/node/commands/typecheck.command.ts
packages/developer/cli/src/node/commands/validate.command.ts
packages/developer/cli/src/node/commands/verify.command.ts
packages/developer/cli/src/node/constants/__tests__/commands.constant.test.ts
packages/developer/cli/src/node/constants/cli-runtime-store.constant.ts
packages/developer/cli/src/node/constants/commands.constant.ts
packages/developer/cli/src/node/constants/console-command.constant.ts
packages/developer/cli/src/node/constants/db-diff-command.constant.ts
packages/developer/cli/src/node/constants/db-seed-command.constant.ts
packages/developer/cli/src/node/constants/gen-command.constant.ts
packages/developer/cli/src/node/constants/mcp-command.constant.ts
packages/developer/cli/src/node/constants/mcp-exec-command.constant.ts
packages/developer/cli/src/node/constants/new-command.constant.ts
packages/developer/cli/src/node/constants/piped-runtime.constant.ts
packages/developer/cli/src/node/constants/seed-pack-command.constant.ts
packages/developer/cli/src/node/constants/testbed-command.constant.ts
packages/developer/cli/src/node/constants/validate-command.constant.ts
packages/developer/cli/src/node/dev-surface/constants/__tests__/dev-command.constant.test.ts
packages/developer/cli/src/node/dev-surface/constants/dev-command.constant.ts
packages/developer/cli/src/node/eas-preflight/constants/eas-preflight-command.constant.ts
packages/developer/cli/src/node/functions/__tests__/run-body.function.test.ts
packages/developer/cli/src/node/functions/__tests__/run-check.function.test.ts
packages/developer/cli/src/node/functions/__tests__/run-cli.function.test.ts
packages/developer/cli/src/node/functions/ask-new.function.ts
packages/developer/cli/src/node/functions/current-cli-runtime.function.ts
packages/developer/cli/src/node/functions/legacy-command.function.ts (deleted)
packages/developer/cli/src/node/functions/new-kinds.function.ts
packages/developer/cli/src/node/functions/run-body.function.ts
packages/developer/cli/src/node/functions/run-check.function.ts
packages/developer/cli/src/node/functions/run-cli.function.ts
packages/developer/cli/src/node/functions/run-gen.function.ts
packages/developer/cli/src/node/product/constants/build-command.constant.ts
packages/developer/cli/src/node/product/constants/deploy-command.constant.ts
packages/developer/cli/src/node/product/constants/preview-serve-command.constant.ts
packages/developer/cli/src/node/types/cli-command.type.ts
packages/developer/cli/src/node/types/cli-commands.type.ts
packages/developer/cli/src/node/types/cli-context.type.ts
packages/developer/cli/src/node/types/cli-runtime.type.ts
packages/developer/cli/src/node/types/gen-outcome.type.ts
packages/developer/cli/src/node/types/new-answers.type.ts
```

## Data models and migrations

none (a developer tool; nothing is stored)

## Contracts

- `runBody(io: CommandIo, body: CliCommand, input: { values, positionals?, rest?, toData? }): Promise<number>`; throws
  `UsageError` with `Usage: <body.usage>` as the hint when the body refuses the line without one.
- `askNew(io: CommandIo, given: NewAnswers, cwd: string): Promise<NewAnswers>`; `newKinds(usage?: string): string[]`.
- `CliRuntime = { inherit: boolean; cli(args, io, cwd): Promise<number> }`; `CLI_RUNTIME_STORE:
AsyncLocalStorage<CliRuntime>`; `PIPED_RUNTIME: CliRuntime` (frozen, `inherit: false`); `currentCliRuntime():
CliRuntime`.
- `CliContext.report?: (data: unknown) => void` (optional); `runGen(…, onOutcome?: (outcome: GenOutcome) => void)`;
  `GenOutcome = { member, clean, errors, warnings, written, stale }`; `NewAnswers`.
- Removed: `legacyCommand`, `CliCommand.group`, `CliCommand.hidden` (added by STA-2872, never released).
- `--json` data: `gen` → `{ check, clean, members, refusals, warnings, skipped, launch }`; `check`, `verify`,
  `validate`, `code:check`, `code:fix` → `{ phases: [{ phase, status, findings, fixable, durationMs }], findings:
Finding[] }`; `validate --repository` → `{ findings: [{ dir, text }] }`; `db diff`, `testbed status` → their JSON
  read back; any other command → `{ exitCode, output: string[] }`.

## Error handling

- An unknown option, a bad choice, or tokens after `--` to a command that takes none: the console's usage error,
  exit 2, before the body runs.
- A body's `CliUsageError` without a hint: exit 2 with the body's usage as the hint, so the message is the body's own.
- `stackra new` without a terminal (or with `--json` / `--no-interaction`): exit 2 naming the first flag to pass
  (`--area`, `--category`, `--description`, `--summary`); nothing is asked.
- A body that prints JSON only on success (`db diff`, `testbed status`) and prints text on a failure: `toData` throws,
  and the data is the exit code and lines instead of a parse error.
- Under `--json` an error becomes `{ "ok": false, "error": { code, message, why, fix } }` from the console.

## Security and tenancy

No tenant data and no secrets. `askNew` reads only the folder names under `packages/` to offer categories, and stores
no answer. Under `--json` and in the MCP capture no tool takes the terminal, so a child process cannot read the
caller's input. The check data carries the findings the text already printed, nothing more.

## Testing strategy

- AC-001, AC-002: `new.command.test.ts` with the console's scripted prompter, in a temp workspace (fails with
  `askNew` bypassed).
- AC-003: `gen.command.test.ts` with gen's `generate` faked (fails without `context.report`).
- AC-004, AC-005: `commands.constant.test.ts` (field parity, every field reaching a stubbed body) and
  `run-cli.function.test.ts` (no passthrough but `runway`); fail with `commands.constant.ts` and `run-cli.function.ts`
  back on `legacyCommand`.
- AC-006: `check.command.test.ts` (the five check classes under `--json`, with `--format json`, and `validate
--repository --json`) and `run-check.function.test.ts` (the report, whatever the format); fail with
  `run-check.function.ts` and `validate-command.constant.ts` without `context.report`.
- FR-005, FR-007: `run-body.function.test.ts` (byte-identical writes, the usage hint, the three `--json` data sources).
- The built binary on box 2: a pseudo-terminal run of `stackra new`, a refusal without one, `gen --check --json` on a
  real member and `check --only config --json`; then the `@stackra/cli` tests, typecheck, oxlint, oxfmt and `gen
--check`.

## Rollout

One minor changeset for `@stackra/cli`. Text output, exit codes and option names are unchanged, so CI and scripts keep
working; `--json` and the questions are new. A product picks it up with its next `stackra` upgrade; nothing to migrate
except the unreleased STA-2872 `CliCommand.group`, which moved to the classes in the same release.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R2: the parser of the most used commands changes; mitigated by the
field-parity test and the byte-identical bodies.

## ADRs

ADR 0506 (`@stackra/console` is the command kernel); ADR 0500 decision 7 (a moved command keeps its output); ADR 0282
decisions 3 and 5; ADR 0529 decision 4 (`stackra runway` stays mounted). No ADR change.

## Docs

`packages/developer/cli/README.md` ("Help, questions and --json"), `apps/docs/src/docs/cli.mdx`,
`apps/docs/src/docs/cli.ar.mdx`, the changeset.

## Complexity tracking

none
