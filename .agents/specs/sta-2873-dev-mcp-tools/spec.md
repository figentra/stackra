# Feature Specification: the developer MCP describes only what exists and serves real commands as tools

**Feature Branch**: `figentra/sta-2873-dev-mcp-tools`

**Created**: 2026-11-26

**Status**: Implementing <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: feature

**Approver**: leader

**Linear**: STA-2873

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: The local developer MCP behind `stackra mcp` served a hand-written tool table (`LOCAL_TOOLS`) whose
descriptions promised `stackra new` kinds (`module`, `action`) and manifest sections that do not exist, so a coding
agent made calls that fail. It had no tool for the app's facts, its HTTP routes or the committed identities, and no
`test`, `typecheck`, `lint` or `check` tool; `new`, `gen`, `validate` and `verify` answered with plain text only. Every
tool was listed with `readOnlyHint` alone, nothing refused a write in a deployed environment, and the proxied Encore
tool list read the first `tools/list` page only (a `shortcut:` comment). Batch AI1 (Stackra Boost) item AI1.1, under
STA-2796.

### Sources

- `packages/developer/mcp/src/node/constants/local-tools.constant.ts` (the table before this change, lines 4, 20, 30)
- `packages/developer/mcp/src/node/functions/serve-local-mcp.function.ts` (the dispatcher and the first-page-only
  Encore list before this change)
- `packages/developer/console/src/core/functions/tools-of.function.ts` and `read-command.function.ts` (how a console
  command declared `tool` becomes an MCP tool, STA-1966 FR-020)
- `packages/developer/cli/src/node/constants/new-command.constant.ts` and `check-phases.constant.ts` (the kinds
  `stackra new` makes and the phases `stackra check` runs)
- ADR 0282 decision 5 (local mode shares one core with the CLI; writes go through the CLI's commands and gates), R-29
  (proxy the local Encore tools), the MCP specification's tool annotations and `tools/list` pagination
- FR-001 to FR-009: the branch's diff against `main` and its tests
- FR-010: the code review of 2026-11-27 (fail closed: an unset `STACKRA_ENVIRONMENT` is not local; `stackra dev` and
  the MCP launcher set `dev` explicitly)

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none (`apps/docs` pages only)
- **Services touched**: none
- **Packages touched**: packages/developer/mcp (the local server, its tool commands, `DevToolHost`),
  packages/developer/console (`tool` hints in `CommandOptions`, `CommandStructure`, `ConsoleTool`, `toolsOf`),
  packages/developer/cli (`ls` declared a tool, `MCP_COMMAND` wiring, `CliContext.cli` takes a folder)
- **Public contract change**: additive. `@stackra/console`: `CommandOptions.tool` also takes `{ readOnly, destructive?,
idempotent? }`; `CommandStructure.tool` and `ConsoleTool` carry `destructive` and `idempotent`. `@stackra/mcp`: new
  exports `DevToolHost` (`.`), `DEV_TOOL_COMMANDS` and the types `Diagnostic`, `TestSummary`, `ToolRunResult`
  (`./node`); `LocalTool` gains optional `destructive` / `idempotent`; `StackraRunner` and `ServeLocalMcpOptions` take
  an optional `{ cwd }` and `env`. `@stackra/cli`: `CliContext.cli` takes an optional `{ cwd }`. Tool surface: the
  `new` tool's input is now `kind` (an enum of the CLI's kinds), `name` and the CLI's own options instead of a free
  `flags` array; `manifest` refuses a section no manifest has instead of answering `null`. No export is removed;
  `LOCAL_TOOLS` was internal.
- **Cross-service events**: none
- **Tenancy and data**: none. Local developer tooling only; never a tenant MCP tool (ADR 0155).
- **Security and privacy**: fail closed. A writing tool is refused before it runs unless `STACKRA_ENVIRONMENT` says
  `dev` or `test`: an unset or empty value is not local, and neither is a call naming another environment.
  `stackra mcp` and `stackra dev` set `STACKRA_ENVIRONMENT=dev` explicitly when it is unset; a value that is set is
  kept. A proxied Encore tool counts as writing unless Encore marks it read-only.
  `app_info` reports provider names only, never provider settings, ids or secret references. Output is capped.
- **Secrets**: none
- **ADR needed**: no (implements ADR 0282 decision 5 and R-29 as written)
- **New dependencies**: none from npm; `@stackra/mcp` now depends on the workspace packages `@stackra/console` and
  `@stackra/validation` (same tier, no cycle: neither depends on `@stackra/mcp`)
- **Deploy modes**: same in all three (developer tooling; not deployed)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/developer/mcp/README.md`, `packages/developer/mcp/AGENTS.md`,
  `apps/docs/src/docs/cli.mdx` and `cli.ar.mdx`, `apps/docs/src/docs/clients-and-tools.mdx` and
  `clients-and-tools.ar.mdx`, a minor changeset for `@stackra/mcp`, `@stackra/console` and `@stackra/cli`
- **Lane**: full (new tools, new exports and a changed tool surface in three developer packages)
- **Change risk**: R1 (developer tooling; no runtime or tenant path changes)

## Glossary _(full lane)_

- **Local developer MCP**: the stdio MCP server `stackra mcp` starts inside a repository (`serveLocalMcp`).
- **Tool command**: a `@stackra/console` command declared `tool`, served through `toolsOf` with its own schema, hints
  and handler.
- **Built-in tools**: the server's own tool commands, `DEV_TOOL_COMMANDS`.
- **Host tools**: tool commands the host passes (`@stackra/cli` passes `doctor` and `ls`); one with a built-in's name
  replaces it.
- **Hints**: the MCP tool annotations `readOnlyHint`, `destructiveHint` and `idempotentHint`.
- **Deployed target**: an environment name other than `dev` or `test` (`LOCAL_ENVIRONMENTS`), or no name at all.
- **Member**: a folder under `apps/`, `packages/<category>/`, `services/` or `workers/` with a `package.json` or a
  committed `stackra.manifest.json`.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - An agent is never told about a kind or section that does not exist (Priority: P1)

A coding agent reads the tool list and calls `new` and `manifest` with the values the schema offers. Every value it is
offered works; a value outside them is refused with the values there are.

**Why this priority**: the old descriptions pushed agents into failing calls, the audit's main finding.

**Independent Test**: compare the `new` tool's `kind` enum with the kinds `stackra new` names, the `check` tool's
phases with `CHECK_PHASES`, and every tool property with the flags of the CLI command it runs.

**Acceptance Scenarios**:

1. **Given** the built-in tools, **When** the `new` tool's `kind` enum is read, **Then** it is exactly the set of kinds
   `stackra new` makes, no more and no fewer.
2. **Given** a repository whose manifests have no `settings` section, **When** `manifest` is called with
   `section: "settings"`, **Then** the call is a tool error naming the sections the manifests hold.

---

### User Story 2 - An agent reads the app and its routes (Priority: P1)

An agent asks for the app's facts, the HTTP routes and the identities a manifest locks, and gets structured data.

**Independent Test**: `tools/call` of `app_info`, `routes` and `ls` over stdio against a fixture repository.

**Acceptance Scenarios**:

1. **Given** a repository with a root runway and members, **When** `app_info` is called, **Then** it answers the root
   package, Node version, environment (and whether it is deployed), the runway's project, environments, provider names
   and Encore app, every member with its kind and manifest counts, and the dev ports.
2. **Given** manifests with endpoints, **When** `routes` is called with a member and a search text, **Then** it answers
   the matching endpoints sorted by path then method, and the matching app pages.

---

### User Story 3 - An agent runs the tests and reads what failed (Priority: P1)

An agent runs `test`, `typecheck`, `lint` or `check` for one member and gets counts and findings with file and line.

**Independent Test**: the tools over stdio with a fake CLI runner that prints real Vitest, tsc, oxlint and check
output, failing and passing; and the real `stackra mcp` against this repository.

**Acceptance Scenarios**:

1. **Given** a failing Vitest run, **When** `test` is called with a member, **Then** the result is an error whose data
   holds the file and test counts and each failure with its file, test path and first error line, and the command ran
   in the member's folder.
2. **Given** tsc or oxlint output, **When** `typecheck` or `lint` is called, **Then** the data lists each diagnostic
   with file, line, column, code and severity, errors first, with the counts.
3. **Given** a passing run, **When** any of them is called, **Then** the result is not an error and the counts say so.

---

### User Story 4 - Writes never reach a deployed environment (Priority: P1)

**Acceptance Scenarios**:

1. **Given** `STACKRA_ENVIRONMENT=production`, **When** a writing tool (`gen`, `new`, `test`, …) is called, **Then**
   it is refused with `deployed_target` before anything runs, and a read-only tool still answers.
2. **Given** a local server, **When** a call names `environment: "staging"`, **Then** the write is refused.
3. **Given** a proxied Encore tool without `readOnlyHint`, **When** it is called on a deployed target, **Then** it is
   refused; a read-only one passes.
4. **Given** no `STACKRA_ENVIRONMENT` (unset or empty), **When** a writing tool is called on `serveLocalMcp`, **Then**
   it is refused with `deployed_target`; **Given** `stackra mcp` or `stackra dev` started with it unset, **Then** they
   run with `STACKRA_ENVIRONMENT=dev`, and with it set they keep the value.

---

### User Story 5 - Every Encore tool is served (Priority: P2)

**Acceptance Scenarios**:

1. **Given** Encore pages its `tools/list`, **When** the client lists tools, **Then** every page's tools are served
   under `encore_`, and a cursor seen before ends the walk.

---

### Edge Cases

- **EC-01**: A tool that runs a command outside `stackra mcp` (no host) refuses with a `CommandError` naming the fix.
- **EC-02**: An unknown member is a tool error listing the members.
- **EC-03**: A run that stops before Vitest prints a summary answers `tests: null`, never zero counts.
- **EC-04**: A check run that prints no JSON report answers `findings: null`, never an empty list.
- **EC-05**: Output longer than the limit keeps its tail in the result; the parsers read all of it.
- **EC-06**: A bad tool input is a tool error the agent can correct; an unknown tool is a protocol error.
- **EC-07**: A runway that does not parse is reported as its error inside `app_info`; the other facts still answer.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE local server SHALL serve as tools only console commands declared `tool`, through `toolsOf`, so each
  tool's input schema, hints and handler are its command's; the hand-written `LOCAL_TOOLS` table SHALL be gone.
- **FR-002**: THE `new` tool's `kind` SHALL be an enum of exactly the kinds `stackra new` makes, the `check` tool's
  `only` / `skip` an enum of exactly the phases `stackra check` runs, and every other tool property a flag of the CLI
  command the tool runs.
- **FR-003**: THE `manifest` tool SHALL refuse a section no committed manifest holds, naming the sections there are.
- **FR-004**: THE local server SHALL offer `app_info`, `manifest`, `routes`, `new`, `gen`, `validate`, `check`,
  `verify`, `test`, `typecheck` and `lint`, and `@stackra/cli` SHALL add `ls` beside `doctor`.
- **FR-005**: WHEN `test`, `typecheck`, `lint`, `gen`, `check` or `verify` runs THE tool SHALL answer the command line,
  folder, exit code, duration and output tail, plus the structured result it reads from the output (Vitest counts and
  failures; diagnostics by file, line and column; gen refusals with their fix; check findings counted by phase).
- **FR-006**: WHERE a tool names a `member` THE command SHALL run in that member's folder.
- **FR-007**: EVERY listed tool SHALL carry `readOnlyHint`, and a writing tool also `destructiveHint` and
  `idempotentHint`; `CommandOptions.tool` SHALL take `destructive` and `idempotent`, `tool: true` resolving to the MCP
  defaults (writes, destructive, not idempotent).
- **FR-008**: IF a tool that is not read-only is called while `STACKRA_ENVIRONMENT` is unset, empty or names an
  environment other than `dev` or `test`, or the call's `env` / `environment` names such an environment, THEN THE
  server SHALL refuse it with `deployed_target` before it runs (fail closed: unset is never local).
- **FR-010**: `stackra mcp` and `stackra dev` SHALL set `STACKRA_ENVIRONMENT=dev` explicitly when it is unset or empty,
  and SHALL keep a value that is set; `app_info` SHALL report an unset environment as `name: null, deployed: true`.
- **FR-009**: THE server SHALL list the Encore tools across every `tools/list` page, following `nextCursor`, and stop
  at a repeated cursor or after 100 pages.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: THE built-in tools SHALL advertise only kinds, phases and flags the CLI has (FR-002), proven against the
  CLI's own definitions.
- **AC-002**: WHEN `app_info`, `routes` or `manifest` is called over stdio THE server SHALL answer structured data from
  the committed files (FR-003, FR-004).
- **AC-003**: WHEN `test`, `typecheck`, `lint` or `check` is called over stdio THE server SHALL answer structured
  results for a failing and a passing run (FR-005, FR-006).
- **AC-004**: WHEN a writing tool is called on a deployed target THE server SHALL refuse it before it runs (FR-008).
- **AC-008**: WHEN a writing tool is called and the server has no environment name THE server SHALL refuse it before
  it runs (FR-008).
- **AC-007**: WHEN `stackra mcp` or `stackra dev` starts THE command SHALL run with `STACKRA_ENVIRONMENT=dev` if it is
  unset or empty and keep the value that is set otherwise (FR-010).
- **AC-005**: WHEN Encore pages its tool list THE server SHALL serve every page (FR-009).
- **AC-006**: WHEN a client lists the tools THE server SHALL give each tool its `readOnlyHint`, and each writing
  tool its `destructiveHint` and `idempotentHint` (FR-007).

## Success Criteria _(mandatory)_

- **SC-001**: `mcp-command.constant.test.ts` (`@stackra/cli`) proves AC-001 and fails when `NEW_KINDS` gains a kind
  or `CHECK_PHASE_NAMES` loses a phase — verified by: unit
- **SC-002**: `serve-local-mcp.function.test.ts` proves AC-002 to AC-006 over stdio, and fails when the guard, the
  paging, the member folder or the section check is reverted — verified by: unit
- **SC-003**: the parser, `listUpstreamTools`, `deployedTarget`, `toolRun` and `toolsOf` tests prove FR-005, FR-007,
  FR-008 and FR-009 — verified by: unit
- **SC-006**: `mcp-command.constant.test.ts` and `dev-command.constant.test.ts` (`@stackra/cli`) prove AC-007 for the
  unset and the set case — verified by: unit
- **SC-004**: the real `stackra mcp` answers `tools/list`, `app_info`, `routes`, `manifest`, `new`, `ls`, `test`,
  `typecheck` and `lint` over stdio in this repository on Linux — verified by: manual
- **SC-005**: the three packages' tests, typecheck, oxlint and oxfmt pass — verified by: manual

## Compatibility and migration

- An MCP client that called `new` with `flags: [...]` now passes the options by name (`category`, `area`, …); an
  unknown key is refused as a tool error naming it.
- A `manifest` call with a section no manifest holds was `null` per member; it is now a tool error naming the sections.
- Command results are now the `--json` document (`structuredContent`) with the text as JSON; clients that read the
  plain text still get it inside `data.output`.
- `@stackra/console` hosts that declared `tool: true` get `destructiveHint: true` (the MCP default it always meant).
- A host that calls `serveLocalMcp` without `STACKRA_ENVIRONMENT` now has its writing tools refused
  (`deployed_target`); it sets `env: { STACKRA_ENVIRONMENT: "dev" }` to write locally. `stackra mcp` and `stackra dev`
  do that themselves when nothing is set. `app_info` reports an unset environment as `name: null, deployed: true`
  instead of `dev`.

## Risks

- **R-1**: The output parsers read Vitest, tsc, oxlint and gen text; a format change upstream drops findings (the raw
  output tail is always in the result, and `tests` / `findings` say `null` rather than inventing zero).
- **R-2**: The CLI passthrough commands are being ported (batch DX1); the `MCP_COMMAND` wiring changed here by two
  lines and may need a rebase.
- **R-3**: An unset `STACKRA_ENVIRONMENT` is never local: `serveLocalMcp` refuses writes then. The `stackra mcp`
  launcher declares `dev` when nothing is set, so a deployed runtime that runs `stackra mcp` without the variable is
  declared local by that launcher; runway sets the variable in every deployed runtime, and a value that is set is
  never overridden.

## Out of scope

- Reading the last runtime error or traces (other AI1 items).
- `--fix` through a tool.
- The hosted MCP (a separate deployment, ADR 0282 decision 10).

## Assumptions

- `stackra check --format=json` prints its findings as the last JSON array of its output.
- The `dev` and `test` environment names are the only local ones in every product's runway.

## Open questions

None.

## Amendments

None.

## Status history

- 2026-11-26 · — → Draft · Claude (STA-2873 session) · created from the branch diff
- 2026-11-26 · Draft → Clarified · Claude (STA-2873 session) · clarifications complete
- 2026-11-26 · Clarified → Planned · Claude (STA-2873 session) · plan.md
- 2026-11-26 · Planned → Tasked · Claude (STA-2873 session) · tasks.md
- 2026-11-26 · Tasked → Implementing · Claude (STA-2873 session) · T001 to T012 on the branch
