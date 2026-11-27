# Feature Specification: one Diagnostic contract for every local MCP tool result, with the full log on disk

**Feature Branch**: `figentra/sta-2886-diagnostic-contract`

**Created**: 2026-11-27

**Status**: Implementing <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: feature

**Approver**: leader

**Linear**: STA-2886

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: A coding agent that runs a tool through `stackra mcp` gets a different result shape from each tool (Vitest
counts and failures, TypeScript and oxlint diagnostics, gen refusals, `stackra check` findings, a command's own error),
and when a run fails without a finding the tool can parse, it has to scrape the output tail. Batch AI1 (Stackra Boost)
item AI1.2, under STA-2796, stacked on STA-2873 (PR #1172), which turned the local tools into commands with per-tool
result shapes. The codes and links line up with the `stackra explain` error catalogue of STA-2891 (PR #1194).

### Sources

- `packages/developer/mcp/src/node/functions/serve-local-mcp.function.ts` on `figentra/sta-2873-dev-mcp-tools` (the
  `--json` document passed through as `structuredContent`)
- `packages/developer/mcp/src/node/types/diagnostic.type.ts` on that branch (a `Diagnostic` with no phase or docs link,
  used by the typecheck, lint and gen tools only)
- `packages/developer/repo-checks/src/node/types/finding.type.ts` (`stackra check --format=json` findings) and
  `packages/developer/cli/src/node/functions/format-finding.function.ts` (a finding printed as `<tool>/<rule>`)
- `packages/developer/cli/src/node/commands/explain.command.ts`, `find-error-code.function.ts` and
  `packages/developer/gen/src/core/functions/format-gen-error.function.ts` on `figentra/sta-2891-stackra-explain` (the
  catalogue, `stackra explain <code> --json`, gen's `docs:` line)
- `packages/developer/console/AGENTS.md` ("a public type a CLI author names goes in `src/contracts/types/`") and
  `packages/foundation/contracts/AGENTS.md` (zero dependencies, foundation vocabulary only)
- ADR 0282 decision 5 (the local MCP runs gen, validate and verify and explains failures)
- FR-001 to FR-006: the sources above and the branch's diff against `figentra/sta-2873-dev-mcp-tools`
- FR-007: the code review of 2026-11-27 (the log file and the tail pass `@stackra/logger`'s `redact`, as the dev
  log does)

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none (`apps/docs` pages only)
- **Services touched**: none
- **Packages touched**: packages/developer/console (the `Diagnostic` and `DiagnosticReport` types),
  packages/developer/mcp (the tool results, the parsers, the log, the docs lookup)
- **Public contract change**: additive in `@stackra/console/contracts` (`Diagnostic`, `DiagnosticReport`). In
  `@stackra/mcp`: the `Diagnostic` type `./node` exported on the unmerged STA-2873 branch is removed in favour of the
  console one; `ToolRunResult` gains `log?`; every local tool's `structuredContent` becomes
  `{ ok, diagnostics, data?, error? }` (the data loses `diagnostics`, the `check` and `verify` data swap `findings` for
  `report`).
- **Cross-service events**: none
- **Tenancy and data**: none. Local developer tooling only (ADR 0155).
- **Security and privacy**: the log and the result's tail are passed through `@stackra/logger`'s `redact` (secret
  shapes: bearer tokens, JWTs, API keys, URL credentials) before they are written or returned: `toolRun` redacts the
  output and the command line, and `writeToolLog` redacts the whole file again as it writes it. The log stays in the
  ignored `.stackra/` folder; a tool name cannot leave `.stackra/logs/`. The docs lookup runs
  only `stackra explain`, which writes nothing.
- **Secrets**: none
- **ADR needed**: no (implements ADR 0282 decision 5 as written)
- **New dependencies**: `@stackra/logger` (workspace, for `redact`) in `@stackra/mcp`
- **Deploy modes**: same in all three (developer tooling; not deployed)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/developer/mcp/README.md`, `packages/developer/mcp/AGENTS.md`,
  `apps/docs/src/docs/clients-and-tools.mdx` and `clients-and-tools.ar.mdx`, a minor changeset for `@stackra/console`
  and `@stackra/mcp`
- **Lane**: full (a new public contract and a changed tool surface in two developer packages)
- **Change risk**: R1 (developer tooling; no runtime or tenant path changes)

## Glossary _(full lane)_

- **Diagnostic**: one finding in the one shape: `phase`, `code`, `severity`, `file`, `line`, `column`, `message`, `fix`,
  `docsUrl`.
- **Diagnostic report**: `{ ok, diagnostics }`, what every local tool result starts with.
- **Phase**: the `stackra check` phase that found a finding, or the tool that ran (`test`, `typecheck`, `gen`).
- **Catalogue**: the error-code reference `stackra explain` reads (STA-2853, STA-2891).
- **Tool log**: `.stackra/logs/last-<tool>.log`, the full plain output of a tool's last run.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - An agent reads one list to see what failed (Priority: P1)

An agent runs `test`, `typecheck`, `lint`, `gen`, `check` or `verify` and reads `structuredContent.diagnostics`: every
failure, whichever tool found it, in the same fields.

**Why this priority**: it is the item: agents scrape long output today.

**Independent Test**: the tools over stdio with a fake CLI runner printing real Vitest, tsc, oxlint, gen and check
output.

**Acceptance Scenarios**:

1. **Given** a failing Vitest run in a member, **When** `test` is called, **Then** `diagnostics` holds one error of
   phase `test` with the test file from the repository root and the test path and first error line as the message.
2. **Given** tsc, oxlint or gen output, **When** `typecheck`, `lint` or `gen` is called, **Then** each finding is one
   diagnostic with its phase, code, severity, file, line and column, and gen's fix.
3. **Given** a `stackra check --format=json` report, **When** `check` or `verify` is called, **Then** each finding is one
   diagnostic with its phase, the code `<tool>/<rule>`, file, place, and `stackra check --fix` when fixable.
4. **Given** a passing run, **When** any tool is called, **Then** `ok` is true and `diagnostics` holds only warnings.

---

### User Story 2 - A failure is never an empty list (Priority: P1)

**Acceptance Scenarios**:

1. **Given** a run that fails without a finding the tool can read, **When** the tool answers, **Then** `diagnostics`
   holds one `command_failed` error naming the command, its exit code and the last line it printed, with the log as
   the fix.
2. **Given** a bad input, an unknown member or a deployed target, **When** the tool answers, **Then** the error is also
   one diagnostic of the tool's phase with its code and fix.

---

### User Story 3 - An agent opens the full log only when it needs it (Priority: P1)

**Acceptance Scenarios**:

1. **Given** any run of a runner tool, **When** it ends, **Then** its full plain output, command line, folder and exit
   line are in `.stackra/logs/last-<tool>.log`, and `data.log` names that path.
2. **Given** a checkout where the log cannot be written, **When** the tool runs, **Then** it still answers, without
   `log`.

---

### User Story 4 - The codes and links match `stackra explain` (Priority: P2)

**Acceptance Scenarios**:

1. **Given** a diagnostic whose code the catalogue lists, **When** the tool answers, **Then** its `docsUrl` is the link
   `stackra explain <code> --json` gives, looked up once per code through the same runner.
2. **Given** gen printed a `docs:` line under a finding, **When** `gen` answers, **Then** that link is the `docsUrl`.
3. **Given** a code the catalogue does not list, or a CLI without `explain`, **When** the tool answers, **Then** the
   diagnostic has no `docsUrl`.

### Edge Cases

- **EC-01**: More than 200 findings: the list holds 200, errors first, and `data.truncated` is true.
- **EC-02**: A finding about the whole repository (check path `.`) has no `file`; a `null` line or column is left out.
- **EC-03**: A finding that already names an absolute file keeps it.
- **EC-04**: A `fix:` or `docs:` line that does not sit right under a gen finding is not read into it.
- **EC-05**: A check run that printed no report answers `report: false` and, as it failed, a `command_failed`
  diagnostic.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001** (example-only): `@stackra/console/contracts` SHALL export `Diagnostic` (`phase`, `code?`, `severity`, `file?`, `line?`,
  `column?`, `message`, `fix?`, `docsUrl?`) and `DiagnosticReport` (`ok`, `diagnostics`), and `@stackra/mcp` SHALL use
  them and declare no finding shape of its own.
- **FR-002**: EVERY local tool call SHALL answer `structuredContent` `{ ok, diagnostics, data?, error? }`, with the
  data's diagnostics lifted to the top and the command's own error added as one diagnostic of the tool's phase.
- **FR-003**: THE `test`, `typecheck`, `lint`, `gen`, `check` and `verify` tools SHALL report each failed test, type
  error, lint finding, gen refusal and check finding as a diagnostic, with the file from the repository root.
- **FR-004**: IF a runner tool's command fails and no error diagnostic was read THEN THE tool SHALL report one
  `command_failed` diagnostic with the last line printed and the log.
- **FR-005**: EVERY runner tool SHALL write the full plain log of its run to `.stackra/logs/last-<tool>.log` and name
  it in `data.log`; a log it cannot write SHALL NOT fail the tool.
- **FR-006**: A diagnostic's `code` SHALL be what `stackra explain` takes (a check finding `<tool>/<rule>`), and its
  `docsUrl` the link gen printed or the one `stackra explain <code> --json` gives, looked up once per code; no link SHALL
  be invented for a code the catalogue does not list.
- **FR-007**: THE runner tools SHALL pass a run's output and command line through `@stackra/logger`'s `redact` before
  the parsers read it, the log is written or the tail is returned, and `writeToolLog` SHALL redact the whole file as it
  writes it.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: THE `Diagnostic` and `DiagnosticReport` types SHALL have exactly the fields of FR-001 (type tests).
- **AC-002**: WHEN each runner tool is called over stdio THE server SHALL answer its findings as diagnostics at the top
  of `structuredContent` (FR-002, FR-003).
- **AC-003**: WHEN a run fails without a readable finding THE tool SHALL answer `command_failed` (FR-004).
- **AC-004**: WHEN a runner tool runs THE log SHALL hold the full output and the result SHALL name it (FR-005).
- **AC-005**: WHEN a diagnostic's code is in the catalogue THE result SHALL carry its `stackra explain` link (FR-006).
- **AC-006**: WHEN a run prints a secret shape THE log file and the tool result SHALL hold the mask in its place
  (FR-007).

## Success Criteria _(mandatory)_

- **SC-001**: `diagnostic.type.test.ts` (`@stackra/console`) proves AC-001 under `tsc` — verified by: unit
- **SC-002**: `serve-local-mcp.function.test.ts` proves AC-002 to AC-005 over stdio and fails when the lifting, the
  log, the docs lookup or the member path is reverted — verified by: unit
- **SC-003**: the parser, `checkDiagnostics`, `testDiagnostics`, `runToolCommand`, `toolResult`, `explainDocs` and
  `writeToolLog` tests prove FR-003 to FR-007 — verified by: unit
- **SC-004**: the two packages' tests, typecheck, oxlint and oxfmt pass, and `fflow gate ci` passes — verified by: manual

## Compatibility and migration

- A client that read `structuredContent.data.diagnostics` reads `structuredContent.diagnostics`; one that read
  `data.findings` of `check` or `verify` reads `diagnostics` (and `data.report` for whether a report was printed).
- A file in a member's run is now from the repository root (`services/commerce/src/a.ts`), not from the member.
- The `error` of a refused call stays beside the new diagnostic, so a client reading `error.code` still works.

## Risks

- **R-1**: Until STA-2891 lands, `stackra explain` does not exist and gen prints no `docs:` line, so no diagnostic has a
  link; the lookup degrades to none, and the links appear with no change here once it lands.
- **R-2**: A lookup per distinct code costs one in-process CLI run; with the spawning runner it is one process per code,
  once per server.

## Out of scope

- Turning the CLI's own `stackra check` text output into diagnostics (it already prints JSON with `--format=json`).
- Mapping a Turborepo task prefix at the root to its member's folder.
- Reading the last runtime error or traces (other AI1 items).

## Assumptions

- `.stackra/` is ignored in every Stackra repository (`**/.stackra/*` in the root `.gitignore`).
- `stackra explain <code> --json` answers the console envelope `{ ok, data: { docs } }` (STA-2891).

## Open questions

None.

## Amendments

None.

## Status history

- 2026-11-27 · — → Draft · Claude (STA-2886 session) · created from the work order and the STA-2873 branch
- 2026-11-27 · Draft → Clarified · Claude (STA-2886 session) · clarifications complete
- 2026-11-27 · Clarified → Planned · Claude (STA-2886 session) · plan.md
- 2026-11-27 · Planned → Tasked · Claude (STA-2886 session) · tasks.md
- 2026-11-27 · Tasked → Implementing · Claude (STA-2886 session) · T001 to T007 on the branch
