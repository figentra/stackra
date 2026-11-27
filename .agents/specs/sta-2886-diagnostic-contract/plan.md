# Implementation Plan: one Diagnostic contract for every local MCP tool result, with the full log on disk

**Spec**: `.agents/specs/sta-2886-diagnostic-contract/spec.md` · **Linear**: STA-2886 · **Date**: 2026-11-27

**Input**: Feature specification from `.agents/specs/sta-2886-diagnostic-contract/spec.md`

## Summary

`Diagnostic` and `DiagnosticReport` move to `@stackra/console/contracts`, the package that owns the public types a
command author names and that both `@stackra/mcp` and `@stackra/cli` already depend on (`@stackra/contracts` is the
zero-dependency foundation vocabulary and takes only symbols foundation packages need). Every reader of tool output
returns diagnostics: the tsc and oxlint parser and the gen parser carry a phase (gen's also its `docs:` line),
`testDiagnostics` maps Vitest failures, `checkDiagnostics` maps `stackra check` findings. `runToolCommand` writes the log,
roots a member's paths, adds `command_failed` and counts and caps the list. `toolResult` lifts the list to the top of
every tool result, adds the command's error as a diagnostic and links each code through `explainDocs`, which runs
`stackra explain <code> --json` through the server's runner, cached per code.

## Technical Context

- **Language**: TypeScript (ESM), Node 24
- **Members**: `packages/developer/console`, `packages/developer/mcp`
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); type tests with `expectTypeOf` under `tsc`; the server tests
  drive real stdio streams with a fake runner and a throwaway repository
- **Storage**: one log file per tool under the ignored `.stackra/logs/`
- **Runtime target**: node (the server and its commands); the contract types are isomorphic

## Constitution Check

| Law                                   | Result | Note                                                                                    |
| ------------------------------------- | ------ | --------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `@stackra/mcp` → `@stackra/console` (already a dependency); no new edge                 |
| Secrets (ADR 0009)                    | PASS   | log and tail pass `@stackra/logger`'s `redact` before they are written or returned      |
| Security                              | PASS   | the log name is sanitised into `.stackra/logs/`; the lookup runs read-only `explain`    |
| HTTP and events                       | N/A    | no route, header or event changes                                                       |
| Tenancy                               | N/A    | local developer tooling, never a tenant tool (ADR 0155)                                 |
| Delegation                            | PASS   | one session, one branch, stacked on STA-2873                                            |
| Not built yet (ADR 0011)              | PASS   | nothing from the table                                                                  |
| Test placement (ADR 0022)             | PASS   | tests sit in `__tests__/` beside each changed file                                      |
| Versions and catalogs                 | PASS   | no dependency change                                                                    |
| Deploy modes (ADR 0076)               | N/A    | developer tooling                                                                       |
| Licence tier (ADR 0077)               | PASS   | free                                                                                    |
| Docs and ADRs                         | PASS   | README, AGENTS.md, one docs page in both languages, a changeset; implements ADR 0282 d5 |

## Deploy modes

| Mode       | Behaviour                    |
| ---------- | ---------------------------- |
| SaaS       | not deployed; developer tool |
| On-prem    | same                         |
| Air-gapped | same                         |

## Correctness properties

- **P-001**: for every tool call, `structuredContent` has `ok` (exit code 0 and the document not `ok: false`) and a `diagnostics` array, and `data` never holds `diagnostics` — Validates: FR-002
- **P-002**: for every runner tool run in a member, every relative `file` starts with the member's path — Validates: FR-003
- **P-003**: for every failed run, `diagnostics` holds at least one error — Validates: FR-004
- **P-004**: for every runner tool run with a writable root, `.stackra/logs/last-<tool>.log` ends with the run's exit line and holds its full output — Validates: FR-005
- **P-005**: for every distinct code without a link in one result, `stackra explain` is asked at most once per server, and a diagnostic gets a `docsUrl` only from a printed link or a successful explain document — Validates: FR-006
- **P-006**: for every run output holding a secret shape, neither the log file nor the tool result holds it — Validates: FR-007

## Architecture overview

A runner tool command's `read` returns `{ diagnostics, ...data }`. `runToolCommand` runs the command (`toolRun`),
writes the log (`writeToolLog`), roots member paths, adds `command_failed` when needed and writes
`{ ...result, log, ...data, ...diagnosticsOf(found) }` as the `--json` data. `serveLocalMcp` passes every built-in and
host tool's document through `toolResult(name, document, exitCode, explainDocs(run))`; the deployed-target refusal goes
through the same function. Encore's proxied tools answer as Encore does.

## Components and responsibilities

- `Diagnostic`, `DiagnosticReport` (`@stackra/console`, `src/contracts/types/`).
- `parseDiagnostics(output, phase)`, `parseGenOutput(output)`, `testDiagnostics(summary)`,
  `checkDiagnostics(findings)`, `checkReport(output)`: output to diagnostics.
- `runToolCommand`, `writeToolLog`, `TOOL_LOG_DIR`: the run, the log, the fallback.
- `toolResult`, `explainDocs`: the MCP result and the catalogue links.

## Files and folders

```text
.agents/specs/sta-2886-diagnostic-contract/
├── plan.md
├── spec.md
└── tasks.md
.changeset/
└── diagnostic-contract.md
apps/docs/src/docs/
├── clients-and-tools.mdx
└── clients-and-tools.ar.mdx
packages/developer/console/src/contracts/
├── index.ts
└── types/
    ├── diagnostic.type.ts
    ├── diagnostic-report.type.ts
    └── __tests__/diagnostic.type.test.ts
packages/developer/mcp/
├── AGENTS.md
├── README.md
├── package.json
├── stackra.manifest.json
└── src/node/
    ├── index.ts
    ├── commands/
    │   ├── check.command.ts
    │   ├── gen.command.ts
    │   ├── lint.command.ts
    │   ├── test.command.ts
    │   ├── typecheck.command.ts
    │   ├── validate.command.ts
    │   └── verify.command.ts
    ├── constants/tool-log-dir.constant.ts
    ├── functions/
    │   ├── check-diagnostics.function.ts
    │   ├── check-report.function.ts
    │   ├── diagnostics-of.function.ts
    │   ├── explain-docs.function.ts
    │   ├── parse-diagnostics.function.ts
    │   ├── parse-gen-output.function.ts
    │   ├── run-tool-command.function.ts
    │   ├── serve-local-mcp.function.ts
    │   ├── test-diagnostics.function.ts
    │   ├── tool-result.function.ts
    │   ├── tool-run.function.ts
    │   ├── write-tool-log.function.ts
    │   └── __tests__/
    │       ├── explain-docs.function.test.ts
    │       ├── parse-check-output.function.test.ts
    │       ├── parse-diagnostics.function.test.ts
    │       ├── parse-gen-output.function.test.ts
    │       ├── serve-local-mcp.function.test.ts
    │       ├── test-diagnostics.function.test.ts
    │       ├── tool-result.function.test.ts
    │       ├── tool-run.function.test.ts
    │       └── write-tool-log.function.test.ts
    └── types/
        ├── diagnostic.type.ts (deleted)
        └── tool-run-result.type.ts
```

## Data models and migrations

none

## Contracts

- `@stackra/console/contracts`: `interface Diagnostic { phase: string; code?: string; severity: "error" | "warning";
file?: string; line?: number; column?: number; message: string; fix?: string; docsUrl?: string }`,
  `interface DiagnosticReport { ok: boolean; diagnostics: readonly Diagnostic[] }`.
- Local MCP tool result: `structuredContent: DiagnosticReport & { data?: unknown; error?: object }`, `isError` the
  exit code's.
- `@stackra/mcp`: `ToolRunResult.log?: string`; the `./node` `Diagnostic` export of the STA-2873 branch is removed.
- Callers: `@stackra/cli`'s `MCP_COMMAND` (unchanged; its runner serves the `explain` lookups).

## Error handling

A command's error document becomes one diagnostic beside the unchanged `error`. A log that cannot be written leaves
`log` out. A failed, thrown or unparseable `explain` run gives no link.

## Security and tenancy

The log is written only under `<root>/.stackra/logs/`, its name reduced to word characters and `-`. It holds the same
output the result returns; `toolRun` passes that output and the command line through `@stackra/logger`'s `redact`,
and `writeToolLog` redacts the whole file again as it writes it. The lookup passes the code as one argv item to
`stackra explain`, a read-only command.

## Testing strategy

- AC-001: `diagnostic.type.test.ts` under `tsc` and vitest.
- AC-002: `serve-local-mcp.function.test.ts` ("runs new, gen, validate and verify…", "runs test, typecheck, lint and
  check…", the manifest and bad-input tests), with the parser and mapper tests.
- AC-003: `tool-run.function.test.ts` ("gives a failed run that printed no error one command_failed diagnostic").
- AC-004: `write-tool-log.function.test.ts`, `tool-run.function.test.ts` and the `test` call reading the log on disk.
- AC-005: `explain-docs.function.test.ts`, `tool-result.function.test.ts` and the `gen` call's `docsUrl`.
- Revert check: restoring the STA-2873 versions of the source files makes the new and changed tests fail.

## Rollout

Minor changesets for `@stackra/console` and `@stackra/mcp`. Agents get the new shape on their next `stackra mcp` start.

## Delegation and risk plan

One session, one branch stacked on `figentra/sta-2873-dev-mcp-tools` (#1172); rebase when it merges. The links depend on
STA-2891 (#1194) at run time only.

## ADRs

ADR 0282 decision 5 (local mode), ADR 0231 (snake_case machine codes), ADR 0294 decision 26 (refusals print their fix),
ADR 0022 (test placement): all Accepted.

## Docs

`packages/developer/mcp/README.md`, `packages/developer/mcp/AGENTS.md`, `apps/docs/src/docs/clients-and-tools.mdx`,
`apps/docs/src/docs/clients-and-tools.ar.mdx`, `.changeset/diagnostic-contract.md`.

## Complexity tracking

none
