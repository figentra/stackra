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

- **P-001**: `passthroughCommands(COMMANDS)` is `["runway"]` — Validates: FR-001, AC-005
- **P-002**: for every ported class, each option its body reads is a described field, and a line giving every field
  reaches the body with every option defined and its positionals in order — Validates: FR-001, FR-002, AC-004
- **P-003**: `stackra new` asks exactly what the line left out, in order, and nothing without a terminal or under
  `--json` — Validates: FR-003, FR-004, AC-001, AC-002
- **P-004**: `gen --json` carries every refusal and warning with its file from the working directory — Validates:
  FR-006, AC-003
- **P-005**: under `--json` standard output is the document alone and a tool never inherits the terminal; without it
  the output is byte-identical — Validates: FR-005, FR-007

## Files

- `packages/developer/cli/src/node/commands/{build,check,code-check,code-fix,console,db-diff,db-seed,deploy,dev,
eas-preflight,gen,lint,mcp,mcp-exec,new,preview-serve,seed-pack,start,test,testbed,typecheck,validate,verify}.command.ts`
  (new)
- `functions/run-body.function.ts`, `ask-new.function.ts`, `new-kinds.function.ts`, `current-cli-runtime.function.ts`,
  `constants/cli-runtime-store.constant.ts`, `piped-runtime.constant.ts`, `types/cli-runtime.type.ts`,
  `gen-outcome.type.ts`, `new-answers.type.ts` (new); `functions/legacy-command.function.ts` (deleted)
- `functions/run-cli.function.ts`, `run-gen.function.ts`, `constants/commands.constant.ts`, `gen-command.constant.ts`,
  `types/cli-command.type.ts`, `cli-context.type.ts`, and the body constants that lose `group` / `hidden`
