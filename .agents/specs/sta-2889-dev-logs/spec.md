# Feature Specification: a dev log `stackra dev` writes, and the `logs`, `last_error` and `browser_logs` MCP tools

**Feature Branch**: `figentra/sta-2889-dev-logs`

**Created**: 2026-11-27

**Status**: Implementing <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: feature

**Approver**: leader

**Linear**: STA-2889

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: A coding agent in a Stackra app could not answer "why did my last request fail?" without the human pasting
terminal output: `stackra dev` wrote no log file, and the browser side sent no signal at all (no capture in
`@stackra/vite-plugin`). Batch AI1 (Stackra Boost, an honest dev MCP) item AI1.3, under STA-2796, stacked on STA-2873
(the dev MCP's tool commands).

### Sources

- `packages/developer/cli/src/node/functions/tool-command.function.ts` and `run-process.function.ts` (how `stackra dev`
  starts a member's dev tool, before this change with the terminal and no copy)
- `packages/developer/vite-plugin/src/core/functions/core-plugins.function.ts` (the preset's own plugins)
- `packages/foundation/logger/src/core/functions/redact.function.ts` (`redact`: credential and personal field names,
  secret shapes inside text)
- `packages/developer/runway/src/node/functions/write-dev-facts.function.ts` (dev facts under `.stackra/` at the root)
- `packages/developer/mcp/src/node/constants/dev-tool-commands.constant.ts` (STA-2873: tools are console commands)
- ADR 0282 decision 5 (the local MCP reads the app and explains failures), ADR 0296 decision 1 (dev facts under
  `.stackra/`), ADR 0147 decision 1 (redaction with secret detection), ADR 0184 decision 5 (logs carry no personal
  data), ADR 0261 decision 4 (the preset's own plugins)
- FR-001 to FR-010: the branch's diff against the STA-2873 branch and its tests
- FR-011: the review of this branch (`stackra dev` on a native or worker member lost Expo's QR code and key menu and
  Wrangler's hotkeys, since `@expo/cli` and Wrangler draw them only when `process.stdout.isTTY`), and the fix's tests

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none (`apps/docs` pages only)
- **Services touched**: none
- **Packages touched**: packages/developer/runway (the dev log's path, entry, writer and reader),
  packages/developer/cli (`stackra dev` tees its tool's output; `ToolRun.tee` and `ToolRun.screen`; `stackra dev
--no-log`), packages/developer/mcp (the `logs`,
  `last_error` and `browser_logs` tools), packages/developer/vite-plugin (`stackra:browser-logs`, dev server only)
- **Public contract change**: additive. `@stackra/runway`: new exports `DEV_LOG_PATH`, `DevLogEntry` (`.`) and
  `devLogFile`, `appendDevLog`, `readDevLog` (`./node`). `@stackra/cli`: `ToolRun` gains an optional `tee` and an optional `screen`, and `stackra dev` a `--no-log` flag.
  `@stackra/mcp`: three new read-only tools in `DEV_TOOL_COMMANDS` and three new commands in its manifest (`logs`,
  `last:error`, `browser:logs`). `@stackra/vite-plugin`: `corePlugins()` and `stackra()` return a fourth plugin,
  `stackra:browser-logs` (`apply: "serve"`). No export is removed or changed.
- **Cross-service events**: none
- **Tenancy and data**: none. Local developer tooling only; never a tenant MCP tool (ADR 0155). The dev log is
  machine-local and gitignored (`.stackra/` in the core and template `.gitignore`).
- **Security and privacy**: every entry passes the logger's `redact` before it is written (field names and secret
  shapes in text), and text past 8000 characters is cut. A browser report keeps the page's origin and path only, never
  its query or fragment. The dev server's report route takes only a same-origin JSON `POST` carrying the client's
  `x-stackra-browser-log` header (a cross-site page cannot send it without a CORS preflight the server never answers),
  at most 64 KiB and 50 entries a request; the client sends at most 200 entries a page load. The route and the client
  exist on the dev server only, never in a build. The MCP tools describe the entries as app output: data, never
  instructions.
- **Secrets**: none
- **ADR needed**: no (implements ADR 0282 decision 5 within ADR 0296 decision 1 and ADR 0147 decision 1 as written)
- **New dependencies**: none from npm; `@stackra/runway` and `@stackra/vite-plugin` now depend on the workspace
  package `@stackra/logger` (foundation tier below developer; `@stackra/logger` depends on neither, so no cycle)
- **Deploy modes**: same in all three (developer tooling; not deployed)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/developer/mcp/README.md`, `packages/developer/runway/README.md`,
  `packages/developer/vite-plugin/README.md`, `apps/docs/src/docs/cli.mdx` and `cli.ar.mdx`,
  `apps/docs/src/docs/clients-and-tools.mdx` and `clients-and-tools.ar.mdx`, a minor changeset for `@stackra/runway`,
  `@stackra/cli`, `@stackra/mcp` and `@stackra/vite-plugin`
- **Lane**: full (new exports, new tools and a new dev server route in four developer packages)
- **Change risk**: R1 (developer tooling; no runtime or tenant path changes)

## Glossary _(full lane)_

- **Dev log**: `.stackra/logs/dev.ndjson` at the repository root (`DEV_LOG_PATH`), one JSON `DevLogEntry` per line,
  plus the one rotated file `dev.1.ndjson`.
- **Entry**: one line of the dev log: time, source (`server` or `browser`), level, member folder, message, and for a
  server line its stream, for a browser report its kind, page and stack, for a JSON line its own fields.
- **Tee**: the copy of a dev tool's output `stackra dev` hands to the dev log while still printing it.
- **Browser report**: an uncaught error, an unhandled promise rejection, or a `console.error` / `console.warn` call a
  page served by the dev server sends to `/__stackra/browser-log`.
- **Member**: a folder under `apps/`, `packages/<category>/`, `services/` or `workers/` (as in STA-2873).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - The server's output is in a file an agent can read (Priority: P1)

A developer runs `stackra dev` in a member. Everything still prints in the terminal, and every line also lands in the
dev log with its level, redacted.

**Why this priority**: without it there is nothing for the tools to read.

**Independent Test**: `toolCommand("dev")` with a fake process that prints a ready line and an error with a bearer
token, then read the dev log.

**Acceptance Scenarios**:

1. **Given** a member in a workspace, **When** its dev tool prints `ERR call failed authorization=Bearer abc.def` on
   stderr, **Then** the dev log at the root holds a start line, the lines with their levels and the member folder, the
   token redacted, and an end line with the exit code.
2. **Given** a stack trace printed line by line, **When** it is teed, **Then** every indented frame carries the level
   of the error line above it.
3. **Given** a dev log that cannot be written, **When** the tool prints, **Then** the developer is told once and the
   tool keeps running and printing.

---

### User Story 2 - The page's errors reach the same log (Priority: P1)

A page served by the dev server throws; the error lands in the dev log with the page and the stack. A page on another
site cannot write to it.

**Independent Test**: the plugin's middleware with same-origin and cross-site requests; the client script run in a
simulated page.

**Acceptance Scenarios**:

1. **Given** a page served by the dev server, **When** it throws, rejects a promise unhandled or calls `console.error`,
   **Then** the client posts a batch and the dev log holds a `browser` entry with its kind, the page's origin and path
   (no query) and the stack.
2. **Given** a cross-site page, another method, a missing client header or a body over 64 KiB, **When** it posts to
   the route, **Then** it is refused (403, 405, 413 or 415) and nothing is written.
3. **Given** `vite build`, **When** the preset's plugins run, **Then** the browser log plugin does not apply.

---

### User Story 3 - An agent asks why the last request failed (Priority: P1)

An agent calls `last_error`, `logs` or `browser_logs` and gets structured entries.

**Independent Test**: the three tools over stdio against a fixture repository with a written dev log.

**Acceptance Scenarios**:

1. **Given** a dev log with a server error printed as several lines, **When** `last_error` is called, **Then** it
   answers the first line of the latest error, every line of it, the lines its member printed before (`context`) and
   up to 10 after.
2. **Given** a dev log, **When** `logs` is called with `source`, `level`, `member`, `since`, `search` or `limit`,
   **Then** it answers the matching entries, latest last, with how many earlier ones were left out.
3. **Given** browser reports, **When** `browser_logs` is called with `kind`, `level` or `search`, **Then** it answers
   the matching reports with page and stack.
4. **Given** no dev log, **When** any of the three is called, **Then** it is a tool error whose fix is `stackra dev`.

---

### Edge Cases

- **EC-01**: A line cut by a crash mid-write is skipped by the reader; the other entries still read.
- **EC-02**: A partial line (no newline yet) is held until its newline or until the tool ends.
- **EC-03**: Two processes (a member's `stackra dev` and its Vite server) append to the same file; a rotation the other
  made first is not an error.
- **EC-04**: A browser report's time that is not within a day of arrival becomes the arrival time.
- **EC-05**: A `since` that is neither a span nor an ISO time is a tool error naming the forms; an unknown member is a
  tool error listing the members.
- **EC-06**: A teed tool on a terminal still prints in colour (`FORCE_COLOR`) unless `NO_COLOR` or `FORCE_COLOR` is set.
- **EC-08**: A dev tool that draws an interactive screen on a terminal stdout (`expo start`: the QR code and the
  i/a/r/j key menu; `wrangler dev`: its hotkeys) keeps the terminal's stdout, so the screen still works; only its
  stderr reaches the dev log. `stackra dev --no-log` runs any dev tool with the terminal alone.
- **EC-07**: Several browser reports a page sends in the same second (a console error, a rejection, an uncaught error)
  stay separate errors; `last_error` answers the latest one with the others in `before`.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: WHEN `stackra dev` runs a member's dev tool THE CLI SHALL copy every line the tool prints into the dev
  log at the repository root, still printing it, with one line when the tool starts and one when it ends.
- **FR-002**: EACH server line SHALL take its level from a JSON line's `level` / `severity` (word or pino number), else
  the first level word, else a JavaScript error or warning line, else `info`; an indented line SHALL take the level of
  the line before it on the same stream.
- **FR-003**: EVERY entry SHALL pass the logger's `redact` before it is written, and a `message` or `stack` longer than
  8000 characters SHALL be cut, saying how much was cut.
- **FR-004**: THE dev log SHALL rotate to `dev.1.ndjson` before a write would take it past 5 MiB, and the reader SHALL
  read the rotated file first and skip a line that is not an entry.
- **FR-005**: THE Stackra Vite preset SHALL add, on the dev server only, a client to Vite's own client module that
  reports uncaught errors, unhandled rejections and `console.error` / `console.warn` with the page's origin and path and
  the stack, at most 200 per page load, without changing what the console prints. A console call's arguments, and a
  rejection reason that is not an error, SHALL be sent structured (`args`), and the dev server SHALL write their text
  from `redact(args)`, so a credential or personal field inside them is masked by name.
- **FR-006**: THE dev server SHALL take a browser report only as a same-origin JSON `POST` with the client's header,
  at most 64 KiB and 50 entries, and append it to the dev log; anything else SHALL be refused before it is read.
- **FR-007**: THE local MCP SHALL offer a read-only `logs` tool that answers the dev log's entries, latest last,
  narrowed by source, lowest level, member, start time and text, at most `limit`, with the count left out.
- **FR-008**: THE local MCP SHALL offer a read-only `last_error` tool that answers the latest error, its whole stack
  (the same member and stream's server error lines within a second of each other; a browser report is always its own
  error), `context` lines before and 10 after, or `error: null`.
- **FR-009**: THE local MCP SHALL offer a read-only `browser_logs` tool that answers browser reports narrowed by kind,
  level, member, time and text.
- **FR-010**: WHEN there is no dev log THE three tools SHALL answer a tool error whose fix is `stackra dev`.
- **FR-011**: WHEN `stackra dev` runs on a terminal a dev tool that draws an interactive screen (`expo start` for a
  native app, `wrangler dev` for a worker, marked `screen` by `resolveTool`) THE CLI SHALL leave the terminal's stdout
  to the tool and tee its stderr only; WHEN `--no-log` is given in a member THE CLI SHALL run the dev tool with the
  terminal alone and write no dev log, and at the workspace root SHALL refuse it as a usage error.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN a member's `stackra dev` prints THE dev log SHALL hold its lines, levelled and redacted, between a
  start and an end line (FR-001, FR-002, FR-003).
- **AC-002**: WHEN the dev log outgrows its limit THE writer SHALL rotate it and the reader SHALL read both (FR-004).
- **AC-003**: WHEN a page served by the dev server reports an error THE dev log SHALL hold it, and WHEN a cross-site
  page posts THE server SHALL refuse it (FR-005, FR-006).
- **AC-005**: WHEN `stackra dev` serves a native or worker member on a terminal THE tool's stdout SHALL be the
  terminal's, and WHEN `--no-log` is given THE dev log SHALL not be written (FR-011).
- **AC-004**: WHEN `logs`, `last_error` or `browser_logs` is called over stdio THE server SHALL answer structured
  entries from the dev log, or the `stackra dev` fix when there is none (FR-007 to FR-010).

## Success Criteria _(mandatory)_

- **SC-001**: `tool-command.function.test.ts`, `dev-log-tee.function.test.ts`, `dev-log-entry-of.function.test.ts` and
  `run-process.function.test.ts` (`@stackra/cli`) prove AC-001 and fail when the tee in `toolCommand("dev")` is removed
  — verified by: unit
- **SC-002**: `append-dev-log.function.test.ts` (`@stackra/runway`) proves AC-002 and the redaction of FR-003 —
  verified by: unit
- **SC-003**: `browser-logs-plugin.function.test.ts`, `browser-log-entries.function.test.ts` and
  `browser-log-client.function.test.ts` (`@stackra/vite-plugin`) prove AC-003 and fail when the plugin is removed from
  `corePlugins`, the refusal is skipped or the arguments are written without `redact` — verified by: unit
- **SC-004**: `logs.command.test.ts`, `last-error.command.test.ts`, `browser-logs.command.test.ts` and
  `parse-since.function.test.ts` (`@stackra/mcp`) prove AC-004 over stdio — verified by: unit
- **SC-007**: `run-process.function.test.ts` (a teed `screen` run's child writes to the same open file as the test
  process; a plain teed run's does not), `resolve-tool.function.test.ts` (Expo and Wrangler dev are `screen`, their
  builds are not) and `tool-command.function.test.ts` (a native and a worker member's dev run is `screen`; `--no-log`
  writes no dev log and is refused at the root) prove AC-005 and fail when the `screen` branch, the marks or the flag
  are removed; under a real pty on Linux the child of a teed `screen` run sees `process.stdout.isTTY === true`, the
  check `@expo/cli` and Wrangler make before drawing their screen — verified by: unit, manual
- **SC-005**: the four packages' tests, typecheck, oxlint and oxfmt pass on Linux — verified by: manual
- **SC-006**: on Linux, a real Vite dev server with the preset serves a page to headless Chromium that warns, logs an
  error with `{ authorization, email }`, rejects and throws; a cross-site post is refused 403; the real `stackra mcp`
  binary answers `browser_logs`, `last_error` (the latest report, not merged) and `logs` over stdio, and the dev log
  holds neither the token, the email, the page's query nor the cross-site text — verified by: manual

## Compatibility and migration

- `stackra dev` now pipes its tool's output instead of handing it the terminal's stdout and stderr; the terminal's
  input is still the tool's, and colour is kept through `FORCE_COLOR` on a terminal. Expo (`expo start`) and Wrangler
  (`wrangler dev`), which check `isTTY` on their stdout before drawing their interactive screen (Expo's QR code and
  key menu, Wrangler's hotkeys), keep the terminal's stdout, and only their stderr is piped and teed (FR-011). A
  developer who wants any tool on the bare terminal runs `stackra dev --no-log`.
- A Vite config built from the preset gets one more plugin, on the dev server only; a build is unchanged.
- A repository's `.gitignore` must ignore `.stackra/` (the core and template ones do).

## Risks

- **R-1**: Level detection reads text; a tool that prints errors without a level word or an error line logs them as
  `info` (the text is still there for `logs` and `search`).
- **R-2**: A server line printed as free text passes the logger's secret-shape scrub only: a personal value inside
  free text (an email in a sentence) is not detected, as with the logger itself; it lands in a machine-local,
  gitignored file and was already on the terminal. A structured (JSON) line, a browser console argument and a
  rejection reason are masked by field name.
- **R-4**: Expo's and Wrangler's stdout (Metro's bundling lines, a worker's `console.log`) is not in the dev log;
  their errors on stderr are. A pty would keep both, at the cost of a native dependency.
- **R-3**: Stacked on STA-2873 (PR #1172); a change to its tool commands before merge needs a rebase here.

## Out of scope

- Runtime traces and the last failed request's trace (Encore's own tools, proxied by STA-2873).
- Shipping the dev log anywhere off the machine.
- Mobile (Metro) dev servers: their output is teed like any dev tool, but pages are not instrumented.

## Assumptions

- Each member's dev tool prints one line per log record.
- The dev server's own pages load Vite's client module (`/@vite/client`), single-page or server-rendered.

## Open questions

None.

## Amendments

None.

## Status history

- 2026-11-27 · — → Draft · Claude (STA-2889 session) · created from the branch diff
- 2026-11-27 · Draft → Clarified · Claude (STA-2889 session) · clarifications complete
- 2026-11-27 · Clarified → Planned · Claude (STA-2889 session) · plan.md
- 2026-11-27 · Planned → Tasked · Claude (STA-2889 session) · tasks.md
- 2026-11-27 · Tasked → Implementing · Claude (STA-2889 session) · T001 to T010 on the branch
- 2026-11-27 · Implementing · Claude (STA-2889 session) · amended from the Linux proof (SC-006): structured console
  arguments redacted by field name (FR-005), browser reports never merged in `last_error` (FR-008, EC-07)
- 2026-11-27 · Implementing · Claude (STA-2889 session) · amended from review: Expo and Wrangler keep the terminal's
  stdout (`ToolRun.screen`) and `stackra dev --no-log` opts out (FR-011, EC-08, AC-005, SC-007, R-4)
