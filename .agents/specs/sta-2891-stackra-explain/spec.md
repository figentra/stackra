# Feature Specification: `stackra explain <code>`, and a docs link on every gen and command error

**Feature Branch**: `figentra/sta-2891-stackra-explain`

**Created**: 2026-11-27

**Status**: Implementing

**Tier**: feature

**Approver**: leader (technical stop under the owner's delegation; change risk R1)

**Linear**: STA-2891

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: the Stackra production-readiness audit (batch DX1, item DX1.4): codes such as `shape_number_kind` print a
one-line fix but no explanation, example or link (`packages/developer/gen/src/core/functions/format-gen-error.function.ts`).
One catalogue must feed the terminal, the docs page and the MCP, and a test must fail when a code has no entry. It
complements STA-2853, which adds the error-code reference page: link to it, do not duplicate it.

## Impact

- **Apps touched**: apps/docs (the catalogue writer and its test under `scripts/error-codes/`, a line on the
  error-code, troubleshooting and CLI pages, `AGENTS.md`, the `error-codes:write` script)
- **Services touched**: none
- **Packages touched**: packages/developer/gen (`ERROR_CODES`, `ERROR_CODES_PAGE`, `errorCodeEntry`, `errorCodeDocs`,
  `ErrorCodeEntry`, the docs line of `formatGenError`), packages/developer/cli (`ExplainCommand`, its MCP tool, the
  troubleshooting fallback link), packages/developer/console (`ConsoleConfig.docs`)
- **Public contract change**: additive: `@stackra/gen` exports `ERROR_CODES`, `ERROR_CODES_PAGE`, `errorCodeEntry`,
  `errorCodeDocs` and the type `ErrorCodeEntry`; `formatGenError` prints a third line (`  docs: <link> (stackra explain
<code>)`); `@stackra/console`'s `ConsoleConfig` gains an optional `docs`; the `stackra` binary gains the `explain`
  command (in `packages/developer/cli/stackra.manifest.json`) and the local MCP an `explain` tool. Nothing is removed
  or renamed.
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none (static text; no input reaches a file, a process or the network)
- **Secrets**: none
- **ADR needed**: no (implements ADR 0294 decision 26, refusals print their fix; ADR 0282 decision 5, the local MCP
  shares the CLI's commands; STA-1966 FR-011, the error screen's docs link)
- **New dependencies**: none
- **Deploy modes**: same in all three (the CLI prints a link; nothing is fetched)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none (terminal output only)
- **Docs to update**: apps/docs/src/docs/customers/error-codes.mdx, apps/docs/src/docs/customers/troubleshooting.mdx,
  apps/docs/src/docs/cli.mdx, apps/docs/AGENTS.md, packages/developer/cli/README.md
- **Lane**: full
- **Change risk**: R1 (developer tooling output; no runtime, data or auth path)

## Discovery

- **Current behaviour**: `formatGenError` prints two lines, the finding and `fix:`; nothing links to an explanation.
  The `stackra` console renders a docs line only when the error or the command names one, and no `stackra` command
  does. The error-code reference (`customers/error-codes`, STA-2853) explains every code, but only on the site
  (SRC-001, SRC-002, SRC-003).
- **Topology**: gen's findings are `GenError`s printed through `formatGenError` by `run-gen`, the tool commands and
  `db diff`; the console's error screen is `renderProblem(problemOf(error, docs))`; the local MCP serves console
  commands declared `tool` through `toolsOf` (SRC-002, SRC-003, SRC-004).
- **Dependencies**: STA-2853's page and its parser (`documentedCodes`, `emittedCodes`); fumadocs-core's
  `remarkHeading`, which gives the site's heading ids (SRC-001, SRC-005).
- **Ownership**: the developer packages and the docs app, core maintainers (SRC-006).
- **Constraints already decided**: ADR 0231 (snake_case machine codes); ADR 0294 decisions 22 and 26; ADR 0282
  decision 5; ADR 0506 (the console); ADR 0514 (the Fumadocs site) (SRC-006).

### Sources

- **SRC-001**: `apps/docs/src/docs/customers/error-codes.mdx` and `apps/docs/scripts/error-codes/` on `figentra/sta-2853-troubleshooting-error-codes`: one row per code, checked against the tools (FR-001, FR-002, FR-006)
- **SRC-002**: `packages/developer/gen/src/core/functions/format-gen-error.function.ts` on `origin/main`: two lines, no link (FR-003)
- **SRC-003**: `packages/developer/console/src/core/functions/create-console.function.ts`, `problem-of.function.ts` and `render-problem.function.ts` on `origin/main`: the docs line needs the error's or the command's link (FR-007)
- **SRC-004**: `packages/developer/cli/src/node/constants/mcp-command.constant.ts` and the console's `toolsOf` on `origin/main`: command tools share the command's schema and handler (FR-005)
- **SRC-005**: fumadocs-core `mdx-plugins/remark-heading` (github-slugger ids, a repeated heading suffixed) (FR-002)
- **SRC-006**: ADR 0231, ADR 0282, ADR 0294, ADR 0506, ADR 0514 in `apps/docs/src/docs/adr/` (FR-001 to FR-008)

## Glossary

- **Catalogue**: `@stackra/gen`'s `ERROR_CODES`, the rows of the error-code reference copied as data.
- **Group**: the heading a code's row sits under on the page (`Shapes and fields`); its site id is the link fragment.

## User Scenarios & Testing

### User Story 1 - A newcomer explains a code in the terminal (Priority: P1)

A developer sees `error shape_number_kind` and runs `stackra explain shape_number_kind`: the cause, the fix, a link to
the code's section of the reference and the command that shows the finding again.

**Why this priority**: the audit's finding; the first refusal is where a newcomer gets stuck.

**Independent Test**: `explain.command.test.ts`.

**Acceptance Scenarios**:

1. **Given** a code the reference lists, **When** `stackra explain <code>` runs, **Then** it prints the row and the
   link and exits 0; with `--json` the row is the data.
2. **Given** a mistyped code, **When** it runs, **Then** it exits 2 and suggests the closest codes.
3. **Given** a `stackra check` finding copied as printed, `<tool>/<rule>` (such as `repo-checks/imports`), **When**
   `stackra explain` runs on it, **Then** it explains the check rule (`imports`), and a mistyped rule is hinted the same
   way; a tool prefix never reaches a gen or Runway code.

### User Story 2 - Every finding and error links to the docs (Priority: P1)

**Independent Test**: `format-gen-error.function.test.ts`, `create-console.function.test.ts`, `run-cli.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** any gen refusal or warning, **When** it prints, **Then** its last line is `  docs: <link> (stackra
explain <code>)`.
2. **Given** a `stackra` error whose error and command name no docs link, **When** the error screen renders, **Then**
   it links the troubleshooting page.

### User Story 3 - An assistant explains the same code through the MCP (Priority: P2)

**Independent Test**: `mcp-command.constant.test.ts` and `explain.command.test.ts`.

### Edge Cases

- **EC-01**: a code in another case, or with `-` for `_`, finds its row; so does a check finding pasted as
  `<tool>/<rule>`.
- **EC-02**: a code the reference does not list links gen's docs line to the page itself.
- **EC-03**: `stackra explain` with no code: asked for at a terminal; a usage error (exit 2) without one.
- **EC-04**: a heading with inline Markdown on the page: the writer refuses it, since its site id needs the full
  parser.

## Requirements

### Functional Requirements

- **FR-001**: THE error-code reference page SHALL be the one catalogue: `pnpm error-codes:write` (apps/docs) SHALL write its rows (code, tool, group, the group heading's site id, cause, fix) to `@stackra/gen`'s `ERROR_CODES`. Sources: SRC-001
- **FR-002**: THE row's anchor SHALL be the id fumadocs-core's `remarkHeading` gives the heading the row sits under. Sources: SRC-005
- **FR-003**: THE `formatGenError` output SHALL end with `  docs: <link> (stackra explain <code>)`, the link being the reference page with the code's group anchor, or the page itself for an unlisted code. Sources: SRC-002
- **FR-004**: THE `stackra explain <code>` command SHALL print the code's tool, group, cause, fix, docs link and, for gen and check, the command that shows the finding again; with `--json` the same fields are the data. A `stackra check` finding copied as printed, `<tool>/<rule>`, SHALL explain its check rule. Sources: SRC-001
- **FR-005**: THE local developer MCP SHALL serve `explain` as a read-only tool with the command's schema and handler. Sources: SRC-004
- **FR-006**: WHEN the catalogue and the page differ, or a code gen, `stackra check` or Runway can print has no row, THEN the catalogue test SHALL fail. Sources: SRC-001
- **FR-007**: THE `ConsoleConfig` SHALL take an optional `docs`, shown on an error screen (and `--json` error) when neither the error nor the command names a link; `stackra` SHALL set it to the troubleshooting page. Sources: SRC-003
- **FR-008**: IF `stackra explain` is given a code the reference does not list THEN it SHALL exit 2 with up to five close codes as the hint and the reference as the docs link. Sources: SRC-001

### Non-functional Requirements

- **NFR-001**: `stackra explain` SHALL work offline: it reads the catalogue shipped in `@stackra/gen` and fetches nothing. Sources: SRC-001

### Key Entities

- **ErrorCodeEntry**: `{ code, tool: "gen" | "check" | "runway", group, anchor, cause, fix }`.

## Acceptance criteria

- **AC-001**: WHEN `stackra explain shape_number_kind` runs THE output SHALL contain its cause, fix, `…/customers/error-codes#shapes-and-fields` and `stackra gen --check`.
- **AC-002**: WHEN any gen finding is formatted THE third line SHALL be its docs line.
- **AC-003**: WHEN a `stackra` command fails with no closer link THE error screen and `--json` error SHALL carry the troubleshooting page.
- **AC-004**: THE `stackra mcp` tool list SHALL contain `explain`, read-only.
- **AC-005**: WHEN a page row changes without `pnpm error-codes:write`, or a tool gains a code without a row, THE apps/docs tests SHALL fail.
- **AC-006**: WHEN `stackra explain repo-checks/imports` runs THE output SHALL be the `imports` row with `…/customers/error-codes#repository-rules` and `stackra check`; a tool prefix SHALL never reach a gen or Runway code.
- **AC-007**: IF `stackra explain` is given a code no row lists (such as `shape_numbr_kind` or `repo-checks/import`) THEN THE command SHALL exit 2 with the closest codes as the hint and the reference as the docs link.

## Success Criteria

- **SC-001**: every one of the 240 codes on the page explains through `stackra explain` with a link to its section — verified by: unit (`catalogue.test.ts`, `error-code-docs.function.test.ts`)

## Out of scope

- A worked example per code: the page has none, and the printed finding names the author's own file and class.
- A docs line on each `stackra check` finding row and on the passthrough commands' own messages (STA-2883 ports them to
  console commands, whose errors then get the fallback link).

## Assumptions

- The page's headings stay plain words (the writer refuses others), and the site keeps fumadocs-mdx's default heading
  ids.

## Amendments

- 2026-11-27 · review finding: a `stackra check` finding pasted as printed (`repo-checks/imports`) did not explain;
  FR-004 now reads `<tool>/<rule>` as its check rule (AC-006, P-005) and the hint reads the rule too (AC-007, P-007).

## Status history

- 2026-11-27 · — → Draft · spec author · written from the STA-2891 branch's diff
- 2026-11-27 · Draft → Clarified · spec author · questions answered from the audit item and STA-2853
- 2026-11-27 → Planned (plan.md)
- 2026-11-27 → Tasked (tasks.md)
- 2026-11-27 → Implementing (built on the branch, tasks ticked)
