# Feature Specification: `@stackra/console` complete, the one CLI engine of `stackra`, `fflow` and `figentra`

**Feature Branch**: `figentra/sta-1966-console-engine`

**Created**: 2026-11-02

**Status**: Planned — Approved by leader 2026-11-02

**Tier**: big

**Approver**: owner (product: new dependencies, Flow adopting a Stackra package); leader (technical stops, under the
owner's delegation)

**Linear**: STA-1966

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: the owner, 2026-11-02: "A new session to work on this full console. Not phase one or two. Add all, so we
can have one package that all depend on, so we can guarantee the output and everything." On `fflow` 0.2.3: "very bad
error handling; show it in a table, highlight stuff". Builds on STA-1730 (`.agents/specs/sta-1730-console`) and
STA-1731 (`.agents/specs/sta-1731-console-commands`), ADR 0506.

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/developer/console (ports, drivers, router, completions, tool definitions);
  packages/developer/cli (`stackra` moves onto `createConsole`; doctor and status-style commands render as tables);
  packages/developer/mcp (local tools derive from command definitions); packages/application/actions (the `command`
  option and `ActionCommand`); packages/developer/gen (the `#stackra/commands` collection, file boundary agreed with
  STA-1947 through the leader); outside core: figentra/flow `packages/figentra-flow` (CLI layer) and figentra/figentra
  `packages/developer/cli`
- **Public contract change**: additive for `@stackra/console` (new ports, drivers, output components, router intents,
  `Command({ group, tool, docs, examples })`, field `prompt`); breaking for the output of `stackra`, `fflow` and
  `figentra` (help, error screens, doctor and status as tables, `--json` documents), each called out in its changeset
- **Cross-service events**: none
- **Tenancy and data**: none (developer tooling; a tenant action run from a command goes through the one action
  pipeline, unchanged)
- **Security and privacy**: the secret guards in `.agents/hooks/_rules.mjs` and the OpenCode guard keep matching
  `figentra bot …` and `figentra secrets import …` (spaced names stay spaced on the command line, FR-012); a password
  prompt never echoes, logs or reaches `--json` or an MCP result; raw child output is shown only under `--verbose` and
  passes the existing secret-field redaction; the local MCP exposes only commands that opt in (`tool: true`)
- **Secrets**: none
- **ADR needed**: yes. An amendment of ADR 0506 (decision 8: Clack, Tab and Ink are allowed behind the Prompter,
  Completions and live Renderer ports, owner 2026-11-02; decision 5: the ports and drivers; Flow and `figentra` depend on
  the package), an amendment note on ADR 0282 d5 (local MCP tools derive from command definitions), and an
  amendment of ADR 0294's action options (`command`, with the actor rule of FR-026) and ADR 0098's v3 note. The STA-1730
  `flow-visual-spec.md` ("Flow never depends on `@stackra/console`") is superseded
- **New dependencies**: `@clack/prompts` 1.8.1 and `@bomb.sh/tab` 0.0.22 (default catalog), `ink` 8.0.0 (default
  catalog), with `react` 19.3.0 and `@types/react` 19.3.0 from catalog `frontend`. Owner approval 2026-11-02,
  STA-1966. Not used: `@bomb.sh/args` (last release 2025-02; `node:util` `parseArgs` stays) and a Bombshell router
  package (the router is ours, FR-010)
- **Deploy modes**: same in all three (a library and three bins; nothing deployed; no outbound call)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: terminal only: the command list, help, error screen, tables, checklists, trees, prompts, live
  screens
- **Docs to update**: `apps/docs/src/docs/guides/console.mdx` (ports, drivers, output components, completions, tools);
  ADR 0506 (amendment); ADR 0282 (note); the package README and AGENTS.md; `packages/developer/cli/README.md`;
  `.agents/specs/sta-1730-console/flow-visual-spec.md` and `adoption.md` (superseded notes); Flow's and figentra's CLI
  READMEs
- **Lane**: full
- **Change risk**: R2 (new third-party dependencies and the output contract of three CLIs; no service or app runtime
  changes)

## Glossary _(full lane)_

- **Port**: an abstract class in `src/contracts/ports/` that the engine calls; everything above it is unchanged when its
  driver changes.
- **Driver**: one implementation of a port (`text`, `ink`, `terminal`, `clack`, `defaults`, `scripted`, `tab`).
- **Definition**: what `readCommand` reads from a `Command` class without constructing it (name, description, group,
  fields with value kinds, defaults, prompts, `tool`, `docs`, `examples`). The CLI parser, the help, the completions,
  the JSON Schema of a local MCP tool and the `--json` document all derive from it.
- **Intent**: what the router decides an argument vector asks for: list, help, version, completion, run or unknown.
- **Problem**: the shape of every error screen: what failed, why, the exact fix command, a docs link, and the raw
  detail shown only under `--verbose`.
- **Checklist**: rows of ok, warn, fail, skip or info, each with a name, a detail and an optional fix line, grouped
  into sections, ending in a summary line that sets the exit code.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - One look and one behaviour in every CLI (Priority: P1)

An operator runs `stackra`, `fflow` or `figentra` with no arguments, with `--help`, with `help <cmd>`, with a typo,
and with `--version`, and sees the same banner, grouped command list with one-line summaries, usage screen, "unknown
command" screen with the closest match, and exit codes, in each product's colours.

**Why this priority**: it is the owner's guarantee ("one package that all depend on") and the first round of findings.

**Independent Test**: the routing test suite runs the same argument vectors against a fixture registry and against each
CLI's registry, and compares exit codes and plain-text output.

**Acceptance Scenarios**:

1. **Given** any of the three CLIs, **When** the operator runs `<bin> status --help`, **Then** the usage of `status` is
   printed, the command does not run, and the exit code is 0.
2. **Given** any CLI, **When** the operator runs `<bin> stauts`, **Then** stderr says the command does not exist and
   suggests `status`, and the exit code is 2.
3. **Given** any CLI, **When** the operator runs `<bin>`, **Then** the banner (terminal only), the version and the
   commands grouped by their group, one line each, are printed and the exit code is 0.

---

### User Story 2 - Doctor and status read as tables (Priority: P1)

An operator runs `stackra doctor` or `fflow doctor` and gets grouped rows (Machine, Repo, Flow, GitHub) with a coloured
status that also has a symbol and a word, a detail and a fix command, and a summary line ("7 passed · 1 warning · 1
error") that sets the exit code. `fflow status` shows tables for specs, worktrees, PRs and sessions that name each
problem.

**Why this priority**: the owner's verdict on `fflow` 0.2.3 and the engine-proof session's first need.

**Independent Test**: snapshot tests of the checklist and table components, colour on and off; each CLI's doctor run
against a fixture repository.

**Acceptance Scenarios**:

1. **Given** a check that fails with a fix, **When** doctor runs, **Then** its row shows `✗ fail`, the detail and the
   fix command, the summary counts it, and the exit code is 1.
2. **Given** only warnings, **When** doctor runs, **Then** the exit code is 0 and the summary names the warnings.
3. **Given** `--json`, **When** doctor runs, **Then** stdout is one document whose `data` is the check rows unchanged.

---

### User Story 3 - Errors explain themselves (Priority: P1)

When a command fails, the operator sees one boxed error: what failed, why, the exact command that fixes it and a docs
link. Git's or pnpm's raw output is not shown unless `--verbose` is given.

**Independent Test**: snapshot tests of the error box; a fixture command whose child process fails, run with and
without `--verbose`.

**Acceptance Scenarios**:

1. **Given** `fflow spec paths` outside a git repository, **When** it runs, **Then** one error box says "not a git
   repository", gives the fix, and no `fatal:` line from git appears.
2. **Given** the same run with `--verbose`, **Then** git's own lines appear under the box, dimmed.

---

### User Story 4 - Prompts that a flag can always answer (Priority: P2)

`stackra create` asks for what is missing with Clack-style prompts (confirm, text, select, multiselect); each prompt is
answered by its flag, and without a terminal each takes its default or exits 2 naming the flag.

**Independent Test**: scripted-prompter runs and non-TTY runs of a fixture command with each prompt kind.

---

### User Story 5 - Long steps and live screens (Priority: P2)

A long step (install, gen, typecheck) shows a spinner and, when it fails, the last lines of its output. A dashboard
(`fflow status --watch`, running checks) redraws live on a terminal and degrades to plain lines without one.

**Independent Test**: the task component under the text driver (plain mode) and under the live driver with a fake
terminal; a failing step's tail is asserted.

---

### User Story 6 - Agents get the same command as a tool (Priority: P2)

An agent connected to the local developer MCP (`stackra mcp`) calls `doctor` and gets the same rows as `stackra doctor
--json`, with an input schema derived from the command's options, so a tool and its command never drift.

**Independent Test**: one fixture command is run as a CLI with `--json`, as a local MCP tool, and through
`runCommandForTest`; the three data payloads are equal.

---

### User Story 7 - Tab completes commands and options (Priority: P3)

`<bin> completion zsh|bash|fish` prints a script; once sourced, Tab completes command names, option names and choice
values.

**Independent Test**: golden tests of the three scripts, and of the completion answers for a set of partial lines.

---

### Edge Cases

- **EC-01**: `NO_COLOR=1`, a pipe or `TERM=dumb`: no escape byte anywhere, including tables, checklists, the error box
  and the live driver (which falls back to text).
- **EC-02**: a table wider than the terminal: the widest text column wraps or truncates with `…`; the status column and
  fix commands are never truncated.
- **EC-03**: Arabic, CJK and emoji cells: columns line up by display width (STA-1730 FR-026 holds).
- **EC-04**: `--json` together with a command that prompts: no prompt; defaults or exit 2 naming the flag.
- **EC-05**: an MCP tool call of a command that prompts: the same as EC-04; a password prompt without a value fails.
- **EC-06**: Ctrl-C during a Clack prompt or an Ink screen: the terminal is restored, exit 130.
- **EC-07**: `ink` cannot be loaded (stripped install): the live screen falls back to the text driver with one stderr
  warning under `--verbose`.
- **EC-08**: `help help`, `help` with an unknown name, and `--help` after `--`: help of `help`; unknown-command
  screen; a positional for the command.
- **EC-09**: a spaced name whose first word is also a command (`mcp` and `mcp sync`): the longest registered match
  wins.

## Requirements _(mandatory)_

### Functional Requirements

#### Ports and drivers

- **FR-001**: THE Console Package SHALL define the ports `Renderer`, `Prompter`, `Completions` and `ProcessRunner` as
  abstract classes in `src/contracts/ports/`, and SHALL take their drivers through `ConsolePorts`, so that a command and
  the kernel are unchanged when a driver is swapped.
- **FR-002**: THE Renderer port SHALL render banner, title, message (info, success, warn, error), key-value, list,
  table, checklist, tree, box, problem, help, command list, task, spinner, progress and live view from typed data, and
  SHALL write only to the run's injected stdout and stderr.
- **FR-003**: THE `text` Renderer driver SHALL be the default and SHALL be today's render functions extended to the
  components of FR-002; WHILE colour is off it SHALL write no escape byte and no cursor movement.
- **FR-004**: WHEN a command starts a task, spinner, progress or live view WHILE output animates (a colour terminal,
  not `--json`, not `--quiet`), THE Console Package SHALL draw it with the `ink` driver, loaded on first use only; IF
  that load fails, THEN it SHALL fall back to the `text` driver (EC-07).
- **FR-005**: THE Prompter port SHALL keep its `terminal`, `defaults` and `scripted` drivers and SHALL add a `clack`
  driver, which `nodePorts()` uses for an interactive run by default; every driver SHALL answer `text`, `password`,
  `confirm`, `select`, `multiselect` and `search`.
- **FR-006**: THE Completions port SHALL produce bash, zsh and fish scripts and SHALL answer a partial command line with
  candidates (commands, options, choice values) from the registry; its driver SHALL be `tab`.
- **FR-007**: THE ProcessRunner port SHALL run a child process with its output captured; WHEN the child fails THE
  Console Package SHALL show the last 20 lines of its output under the failed task, and SHALL show the whole output only
  under `--verbose`.

#### Output components

- **FR-008**: THE table component SHALL take columns (header, key, alignment, kind `text | status | command | count`),
  rows and optional groups, SHALL align by display width, SHALL colour a status cell and always write its symbol and
  word (`✓ ok`, `⚠ warn`, `✗ fail`; ASCII `+ ok`, `! warn`, `x fail`), and SHALL fit the terminal width (EC-02).
- **FR-009**: THE checklist component SHALL render grouped rows of `{ name, status, detail?, fix? }` and a summary line
  ("N passed · N warnings · N errors"); WHEN a row fails, THE Console Kernel SHALL end the run with exit code 1 unless
  the handler returns another code.
- **FR-010**: THE tree component SHALL render nodes `{ label, count?, note?, children? }`, one line per node to depth 1,
  and every depth under `--verbose`.
- **FR-011**: WHEN a command fails, THE Console Output SHALL write one boxed problem: the title (what failed), the
  reason (why), the fix command, the docs link and, under `--verbose`, the cause chain and captured child output; an
  error that carries no fields of its own SHALL still render in the same box with its message as the title.

#### Routing

- **FR-012**: THE Console Kernel SHALL route an argument vector to exactly one intent (list, help, version,
  completion, run, unknown) before any container is created; spaced names (`mcp sync`, `bot gh`) SHALL match registered
  `:`-joined names, the longest match first (EC-09).
- **FR-013**: WHEN the intent is help (`--help`, `-h` or `help <cmd>`), THE Console Kernel SHALL print the command's
  usage, arguments, options, examples and docs link and SHALL NOT run the command.
- **FR-014**: WHEN the intent is unknown, THE Console Kernel SHALL write the unknown-command problem with up to three
  closest names and SHALL exit 2.
- **FR-015**: WHEN the intent is list, THE Console Kernel SHALL write the banner (terminal only), the name and version,
  and the visible commands grouped by `group` (else by namespace), one line each with its summary.
- **FR-016**: THE Console Kernel SHALL register the built-in commands `help` and `completion <shell>`, which a registry
  cannot shadow.

#### Definitions, JSON and MCP

- **FR-017**: THE Console Package SHALL read from a `Command` class, without constructing its collaborators, the
  definition of the Glossary, including `group`, `docs`, `examples`, `tool` and each field's `prompt`.
- **FR-018**: WHEN a field with `prompt` has no value from its flag or argument, THE Console Kernel SHALL ask it through
  the Prompter WHILE interactive, and SHALL otherwise use its default or exit 2 naming the flag (EC-04).
- **FR-019**: WHILE `--json` is given, THE Console Kernel SHALL emit the data the handler returned or set, unchanged,
  as `{ ok, data }` or `{ ok: false, error: { code, message, why?, fix?, docs? } }`.
- **FR-020**: THE Console Package SHALL derive, for every command whose definition has `tool: true`, a local MCP tool:
  name, description, a JSON Schema of its fields, the read-only hint, and an invoke function that runs the command
  through the same kernel with captured ports and returns its JSON document as structured content.
- **FR-021**: WHEN a handler returns typed data and writes nothing itself, THE Console Output SHALL present it: an array
  of objects as a table, an array of checklist rows as a checklist, an object as key-value lines.
- **FR-022**: WHERE an action or query declares `command: string | { name, group? }` in its kind options, gen SHALL
  add a generated command to `#stackra/commands`, and `ActionCommand(ActionClass)` SHALL prompt for missing input fields
  from the action's input schema, run it through `ActionPipeline.execute` and present its output by FR-021 (Q1: A,
  leader 2026-11-02).
- **FR-026**: WHEN an action runs as a command THE actor SHALL be the signed-in CLI identity, never a privileged
  operator by default; the operator and break-glass ports SHALL apply only where the action allows them, and every
  refusal of the pipeline (iam, policy, entitlement, approval) SHALL render as a problem with exit code 1.
- **FR-027**: WHERE a console command has `tool: true` THE Console Package SHALL expose it only on the local developer
  MCP; no action's write SHALL become an AI tool through the console.
- **FR-028**: WHEN a command runs a child with `interactive: true` WHILE stdin and stdout are terminals, THE
  ProcessRunner SHALL inherit the standard streams (keystrokes and progress visible, as `doctor --fix` needs for
  `mise install`, `xcode-select --install`, `gh auth login`); IF the run is not interactive THEN THE ProcessRunner SHALL
  refuse with a problem naming the command, without starting it (engine-proof, 2026-11-02).
- **FR-029**: THE ConsolePorts SHALL carry the run's working directory and THE CommandIo SHALL expose it as `io.cwd`;
  no command or driver SHALL read `process.cwd()` (the local MCP and tests run commands for another directory).
- **FR-030**: WHILE `--json` is given, THE Console Kernel SHALL emit checklist and table rows exactly as the command gave
  them, extra fields included (doctor's `run` argv); WHEN the run's exit code is not 0 and no error was thrown, THE
  Console Kernel SHALL emit `{ "ok": false, "data": ... }`, so a command emits its data and sets its exit code together
  (a failed checklist row, or a returned code after `io.output.json`).
- **FR-031**: WHERE a command declares `passthrough: true` THE Console Kernel SHALL hand it every token after its name
  raw in `io.rest` and parse no fields for it, keeping routing, help and the error screen; THE Console Package SHALL
  list such commands (`passthroughCommands`), and STA-1966 SHALL NOT be done while any `stackra`, `fflow` or
  `figentra` command is passthrough (A-001; migration only, ADR 0500 decision 7).

#### Adoption

- **FR-023**: `stackra` (`@stackra/cli`) SHALL run on `createConsole`, with doctor rendered by the checklist component
  and status-style commands by the table component, and SHALL feed `@stackra/mcp`'s local tools from FR-020 instead of
  the hand-written tool table.
- **FR-024**: `fflow` SHALL run on `createConsole` and SHALL fix every finding of the 2026-11-02 rounds: per-command help,
  the unknown-command screen, doctor as a grouped checklist with a missing `credentials` block at warn on a fresh local
  repository, status tables with named problems (all of them under `--verbose`), sessions detected from live agent
  sessions in a listed worktree, `spec paths` falling back to the spec folder that matches the branch slug, a
  non-circular `gate dir` hint that names `--key`, and no raw git or pnpm output outside `--verbose`.
- **FR-025**: `figentra` (`@figentra/cli`) SHALL run on `createConsole` with its theme from the Figentra brand tokens,
  keeping its spaced command names and the secret guards' matches.

### Key Entities

- **CommandDefinition**: name, aliases, description, group, hidden, docs, examples, tool (`true` and `readOnly`), fields
  (name, positional or flag, short, value kind, default, required, prompt, choices, secret).
- **CheckRow**: name, status (ok, warn, fail, skip, info), detail, fix, group, and any extra fields the command adds,
  kept unchanged for `--json` (FR-030).
- **Problem**: title, why, fix, docs, cause, detail.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN a driver is replaced by another driver of the same port THE fixture command SHALL pass its tests
  without a change.
- **AC-002**: WHEN `<bin> <cmd> --help` or `<bin> help <cmd>` runs THE handler of `<cmd>` SHALL NOT be called.
- **AC-003**: WHEN an unknown command runs THE exit code SHALL be 2 and stderr SHALL name the closest command.
- **AC-004**: WHEN a checklist has a failed row THE exit code SHALL be 1 and the summary line SHALL count it.
- **AC-005**: WHILE colour is off THE captured output of every component SHALL contain no byte 0x1b.
- **AC-006**: WHEN one command runs with `--json`, as a local MCP tool and through the test harness THE Console Package SHALL return equal data.
- **AC-007**: WHEN a child process fails without `--verbose` THE output SHALL show the problem and the last 20 lines
  under the task, and no other child line.
- **AC-008**: THE completion scripts for bash, zsh and fish SHALL match their golden files and complete a command,
  an option and a choice value.

## Success Criteria _(mandatory)_

- **SC-001**: The routing suite (help, `help <cmd>`, unknown, version, list, spaced names) passes for the fixture
  registry and for each of `stackra`, `fflow` and `figentra` — verified by: unit
- **SC-002**: Every renderer component has a snapshot with colour on and colour off, and every status cell carries a
  symbol and a word — verified by: unit
- **SC-003**: Each finding of the three `fflow` 2026-11-02 rounds has a test that failed before and passes after —
  verified by: unit (Flow's suite)
- **SC-004**: The command list of 50 commands still renders in under 150 ms (p95), and a run that draws no live view
  never loads `ink` — verified by: unit (module-load assertion) and the STA-1730 timing test
- **SC-005**: `pnpm verify` is green in core, and each of Flow's and figentra's gates is green, on a ci-box —
  verified by: ci-box run
- **SC-006**: The owner re-runs the 2026-11-02 `fflow` try-out and confirms tables, highlighting and errors — verified
  by: manual

## Out of scope

- Tenant MCP tools: actions reach AI only through the `ai` service's gateway (ADR 0155); the console registers none.
- `runway`'s CLI (not named by the owner for this issue; it follows once the engine ships).
- Flow's own 0.3.0 work (paused for Runway): only the CLI layer moves.
- A REPL and command middleware.

## Assumptions

- `@stackra/console` is released before Flow and figentra adopt it: a prerelease from CI for their PRs, then the
  owner-approved release; agents never release.
- `fflow` is already published to the Stackra registry (`publishConfig.registry`), so depending on `@stackra/console`
  changes no install path.
- Node 24 does not run decorators, so the CLI layers of Flow and figentra move from `.mjs` to TypeScript built with
  tsdown (Q2).
- Clack is published as `@clack/prompts` (the Bombshell organisation); the owner's `@bomb.sh/*` approval names Clack.

## Amendments

- A-001 · 2026-11-02 · each CLI's port step keeps its flags and output (ADR 0500 decision 7), and porting dozens of
  self-parsing commands at once is not one reviewable change; approved by the leader as a migration state, not an end
  state · added: FR-031

## Status history

- 2026-11-02 · — → Draft · Claude (console-engine) · created
- 2026-11-02 · Draft → Clarified — Approved by leader 2026-11-02 · Q1 A (`command` option, CLI identity as actor, refusals as problems), Q2
  yes (CLI layers to TypeScript), Q3 shapes relayed to engine-proof; ADR amendments, not a new ADR
- 2026-11-02 · Clarified → Planned — Approved by leader 2026-11-02 · spec and plan approved
- 2026-11-02 · Planned → Draft · Claude (console-engine) · A-001 (passthrough, FR-031)
- 2026-11-02 · Draft → Planned — Approved by leader 2026-11-02 · A-001, with its migration-only condition
