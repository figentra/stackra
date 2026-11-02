# Implementation Plan: `@stackra/console` complete, the one CLI engine

**Spec**: `.agents/specs/sta-1966-console-engine/spec.md` · **Linear**: STA-1966 · **Date**: 2026-11-02

**Input**: Feature specification from `.agents/specs/sta-1966-console-engine/spec.md`. Approved by the leader
2026-11-02 (Q1 A, Q2 yes, Q3 relayed to engine-proof).

## Summary

Today's `@stackra/console` already has the Command kind, `parseArgs`, `--help` that doesn't run the command, unknown-name
suggestions (exit 2), `--json`, a plain table, prompts and themes. What's missing is a seam: its render functions are
called directly, so nothing can be swapped and nothing richer (status tables, checklists, trees, boxed problems, live
screens) has a home. This plan puts four ports under the existing `ConsoleOutput` and `ConsolePrompt` facades, adds the
missing components and the router intents, derives local MCP tools from the same definitions, and then moves `stackra`,
`fflow` and `figentra` onto it. A command author's API (`Command`, `@Argument`, `@Option`, `io.output`, `io.prompt`)
stays the same and gains methods.

## Technical Context

- TypeScript, Node 24; `node:util` `parseArgs` and `styleText` stay. New: `@clack/prompts` 1.8.1, `@bomb.sh/tab` 0.0.22
  and `ink` 8.0.0 (default catalog), with `react` and `@types/react` 19.3.0 (catalog `frontend`). All are dependencies
  of `@stackra/console`; `ink` and `react` are reached only through a dynamic `import()` in the live driver, so a run
  without a live view never loads them.
- Tests: vitest snapshots (colour on and off), in `__tests__/` beside each subject, on a ci-box.

## Constitution Check

- Boundaries: the console stays `tier:lib`, `developer`; it imports no app, service or other package's `src/`. `@stackra/console` gains no dependency on `@stackra/actions`: the action bridge lives in
  `@stackra/actions/node` (actions already depend on container and validation; the console is the lower layer).
- Secrets: no value is read; password answers never reach output, logs, `--json` or MCP results (FR-018, EC-05).
- Versions: exact pins in catalogs, with a changeset.

## Deploy modes

| Mode       | Behaviour                                         |
| ---------- | ------------------------------------------------- |
| SaaS       | not deployed; developer tooling, no outbound call |
| On-prem    | not deployed; developer tooling, no outbound call |
| Air-gapped | not deployed; developer tooling, no outbound call |

## Correctness properties

- **P-001**: Swapping a driver for another of the same port changes no command and no kernel line — Validates: FR-001, FR-003, FR-004, FR-005
- **P-002**: Every Renderer component writes only to the run's injected streams and, with colour off, writes no byte 0x1b — Validates: FR-002, FR-003, FR-008, FR-009, FR-010, FR-011
- **P-003**: A non-animated run never loads the live driver; an animated run that cannot load it renders with the text driver — Validates: FR-004
- **P-004**: Completion scripts and answers are pure functions of the definitions and the shell — Validates: FR-006
- **P-005**: Without `--verbose` no child output reaches the streams except the last 20 lines under a failed task — Validates: FR-007, FR-011
- **P-006**: A failed checklist row yields exit 1 unless the handler returns another code — Validates: FR-009
- **P-007**: Routing is a pure function of argv and the registry, decided before any container exists; help and version never construct a command — Validates: FR-012, FR-013, FR-014, FR-015, FR-016
- **P-008**: One definition gives the parser, the help, the completions and the tool schema; nothing is written twice — Validates: FR-017, FR-020
- **P-009**: A missing prompted field is asked only while interactive; otherwise its default, or exit 2 naming the flag — Validates: FR-018
- **P-010**: `--json`, a local MCP call and `runCommandForTest` return equal `data` — Validates: FR-019, FR-020, FR-021
- **P-011**: An action run as a command goes through `ActionPipeline.execute` as the signed-in CLI identity, and every refusal renders as a problem — Validates: FR-022, FR-026
- **P-014**: An interactive child starts only on a terminal; otherwise it is refused before it starts — Validates: FR-028
- **P-015**: Every command and driver reads the working directory from the ports, never the process — Validates: FR-029
- **P-016**: `--json` rows equal the rows the command gave; a non-zero exit with data emits `ok: false` and the data — Validates: FR-030
- **P-017**: A passthrough command gets its raw tokens and no parsed fields; `passthroughCommands` lists exactly the commands still passthrough — Validates: FR-031
- **P-012**: Only `tool: true` console commands appear on the local developer MCP; no action write does — Validates: FR-027
- **P-013**: Each CLI's routing suite and each fixed fflow finding pass against its own registry — Validates: FR-023, FR-024, FR-025

## Architecture overview

```text
argv ─▶ router (intent) ─▶ list | help | version | completion | unknown   (no container)
                       └─▶ run ─▶ fill fields (flags → prompts via Prompter) ─▶ handle(io)
io.output (ConsoleOutput facade, unchanged API + new components)
      └─▶ Renderer port ─▶ text driver (default)     └─ live parts ─▶ ink driver (lazy) ↘ text fallback
io.prompt (ConsolePrompt facade) ─▶ Prompter port ─▶ clack | terminal | defaults | scripted
io.process ─▶ ProcessRunner port ─▶ node driver | memory driver (tests, MCP)
completion <shell> ─▶ Completions port ─▶ tab driver
definition (readCommand) ─▶ parser · help · completions · toolOf() ─▶ @stackra/mcp local server
```

## Components and responsibilities

The four ports and their drivers, the command-facing facades, the definition, the router, the JSON and MCP
derivation, and the action bridge, in that order.

### The port shapes (for the engine-proof agreement)

```typescript
// src/contracts/ports/renderer.port.ts
export abstract class Renderer {
  abstract banner(theme: ConsoleTheme, version: string): void;
  abstract message(tone: "info" | "success" | "warn" | "error", text: string): void;
  abstract title(text: string): void;
  abstract keyValue(entries: Readonly<Record<string, unknown>>): void;
  abstract list(items: readonly string[]): void;
  abstract table(table: TableSpec): void;
  abstract checklist(checklist: ChecklistSpec): ChecklistSummary; // counts; the kernel reads `failed`
  abstract tree(root: TreeNode | readonly TreeNode[], options?: { expanded?: boolean }): void;
  abstract box(text: string, tone?: NoteTone, title?: string): void;
  abstract problem(problem: Problem, options: { verbose: boolean }): void;
  abstract help(definition: CommandDefinition, binary: string): void;
  abstract commandList(groups: readonly CommandGroup[], binary: string): void;
  abstract task<T>(label: string, work: (step: TaskStep) => Promise<T>): Promise<T>; // tail on failure
  abstract spinner(message: string): Spinner;
  abstract progress(total: number, label?: string): Progress;
  abstract live<S>(view: LiveView<S>): LiveHandle<S>; // dashboards: a state and a render(state) → rows
}

// src/contracts/types/
type Status = "ok" | "warn" | "fail" | "skip" | "info";
interface TableColumn {
  header: string;
  key: string;
  kind?: "text" | "status" | "command" | "count";
  align?: "left" | "right";
  wrap?: boolean;
}
interface TableSpec {
  columns: readonly TableColumn[];
  rows: readonly Readonly<Record<string, unknown>>[];
  groupBy?: string;
  title?: string;
}
interface CheckRow {
  name: string;
  status: Status;
  detail?: string;
  fix?: string;
  group?: string;
  readonly [extra: string]: unknown; // passes through --json unchanged (FR-030)
}
interface ChecklistSpec {
  rows: readonly CheckRow[];
  groups?: readonly string[] /* order */;
  title?: string;
}
interface ChecklistSummary {
  passed: number;
  warnings: number;
  failed: number;
  skipped: number;
}
interface TreeNode {
  label: string;
  count?: number;
  note?: string;
  status?: Status;
  children?: readonly TreeNode[];
}
interface Problem {
  title: string;
  why?: string;
  fix?: string;
  docs?: string;
  cause?: unknown;
  detail?: string;
}
interface TaskStep {
  update(message: string): void;
  output(chunk: string): void; /* kept for the failure tail */
}
```

The renderer is built per run around a `RenderContext` (`mode`, `theme`, `painter`, `symbols`, `columns`, `stdout`,
`stderr`), so drivers never test a TTY or the environment (the STA-1730 `decideMode` rule holds).

```typescript
// src/contracts/ports/prompter.port.ts  (today's Prompter type becomes the abstract class; same one method)
export abstract class Prompter {
  abstract ask(request: PromptRequest): Promise<PromptAnswer>;
}

// src/contracts/ports/completions.port.ts
export abstract class Completions {
  abstract script(
    shell: "bash" | "zsh" | "fish",
    binary: string,
    registry: readonly CommandDefinition[],
  ): string;
  abstract complete(
    line: readonly string[],
    registry: readonly CommandDefinition[],
  ): readonly Candidate[];
}

// src/contracts/ports/process-runner.port.ts
export abstract class ProcessRunner {
  abstract run(
    command: string,
    args: readonly string[],
    options?: {
      cwd?: string;
      env?: Record<string, string>;
      interactive?: boolean; // inherit stdio on a TTY; refuse, naming the command, otherwise (FR-028)
      onOutput?: (chunk: string) => void;
    },
  ): Promise<{ code: number; output: string }>;
}
```

`ConsolePorts` (today: streams, TTY flags, env, columns, signals, prompter factory) gains `cwd` (also `io.cwd`, FR-029), `renderer?`, `completions?`
and `process?` factories; `nodePorts()` binds `text`+`ink`, `clack`, `tab` and the node process runner. The MCP bridge
keeps passing its own streams (the engine-proof `CliIo` mapping keeps working unchanged).

### `CommandIo` and `ConsoleOutput` additions

`io.output` gains `checklist`, `tree`, `problem`, `live` and `present(data)` (FR-021); `table` gains the `TableSpec`
overload (the `(headers, rows)` form stays). `io.process` is the ProcessRunner. A `CommandError` class (in core)
carries `why`, `fix` and `docs` beside its message; `UsageError` maps its hint to `fix`.

### CommandDefinition

Today's `CommandStructure` is the definition; it gains:

```typescript
Command({ name, description, aliases?, hidden?, group?: string, docs?: string, examples?: readonly string[],
          tool?: boolean | { readOnly: boolean } })
@Option({ short?, description?, prompt?: string, choices?: readonly string[], secret?: boolean })
@Argument({ description?, optional?, prompt?: string, choices?: readonly string[] })
```

### Routing

`route(argv, registry) → Intent`, a pure function replacing the branch chain in `createConsole`:
`{ kind: "list" } | { kind: "version" } | { kind: "help"; entry } | { kind: "completion"; shell | line }
| { kind: "run"; entry; values } | { kind: "unknown"; typed; suggestions }`. `splitInvocation` joins the longest run of
leading words that forms a registered `a:b[:c]` name. `help` and `completion` are built-in and reserved.

### How JSON and MCP derive from a definition

- **JSON**: unchanged contract (`{ ok, data }` / `{ ok: false, error }`), with `why`, `fix`, `docs` added to the error.
  `data` is what `handle` returns or sets through `io.output.json`/`checklist`; the checklist sets the exit code, so a
  doctor returns its rows and still exits 1. A non-zero exit without a thrown error emits `{ ok: false, data }`; rows are
  emitted exactly as given, extra fields included (FR-030).
- **MCP**: `toolsOf(registry)` (in `@stackra/console`, no MCP SDK) returns, per `tool` command,
  `{ name, description, inputSchema, annotations: { readOnlyHint }, invoke(args) }`. The JSON Schema comes from the
  fields' value kinds (`@Str` string with its bounds, `@Int` integer, `@Num` number, `@List` array, flag boolean,
  `choices` enum). `invoke` turns args into an argv, runs the kernel with memory streams, `--json` and no TTY, and
  returns `{ structuredContent: data, content: [plain-text render], isError }`. `@stackra/mcp`'s `serveLocalMcp`
  takes `toolsOf(stackraRegistry)` instead of `LOCAL_TOOLS` and its `switch`.
- **Actions** (Q1): see below; tenant MCP tools stay on the action's own path through the `ai` gateway.

### Actions as commands (Q1: A, leader 2026-11-02)

`@AsCommand` is retired in v3 (ADR 0098 v3 note; `retired-decorators.constant.ts`); a surface is an option on the kind
(`tool`, `endpoint`, `job`).

- An option `command?: string | { name, group? }` on `Action({...})` and `Query({...})` (ADR 0294 options amendment).
- `@stackra/actions/node` ships the runtime `ActionCommand(ActionClass)`: it reads the input `Schema`'s fields (the same
  `@Str`/`@Int`/`@List` decorators the console already reads), prompts for missing ones, runs `ActionPipeline.execute`,
  and presents the output by FR-021.
- **Actor** (FR-026): the signed-in CLI identity, never a privileged operator by default; the operator and break-glass
  ports apply only where the action allows them; every pipeline refusal (iam, policy, entitlement, approval) renders as
  a problem.
- **gen boundary** (agreed with gen-ui-2c through the leader): `#stackra/commands` already exists
  (`emit-commands.function.ts`, `commandsOf(ir)`, STA-1731). After STA-1947 PR 3 lands its pure helper
  `core/functions/contributions-of.function.ts`, `commandsOf`'s host loop moves onto it, and the `command` option is
  handled in emit-commands and the commands section only. The one shared file is `build-manifest.function.ts`, one line
  per section. emit-routes, emit-resources and the menu table are not edited. PR 10 follows STA-1947 PR 3.
- Writes never become AI tools through the console (FR-027); tenant tools stay on the action's own path.

### Drivers

| Port          | Drivers                                     | Default                                     |
| ------------- | ------------------------------------------- | ------------------------------------------- |
| Renderer      | `text`, `ink` (live parts only, lazy)       | `text`; `ink` for live parts while animated |
| Prompter      | `clack`, `terminal`, `defaults`, `scripted` | `clack` interactive, `defaults` otherwise   |
| Completions   | `tab`                                       | `tab`                                       |
| ProcessRunner | `node` (`./node`), `memory` (`./testing`)   | `node`                                      |

## Files and folders

`packages/developer/console/src/`: `contracts/ports/{renderer,completions,process-runner,prompter}.port.ts`;
`contracts/types/` for the shapes above; `core/functions/route.function.ts`, `render-checklist`, `render-tree`,
`render-problem`, `render-status`, `tools-of`, `json-schema-of`, `present-data`; `core/drivers/text-renderer.driver.ts`;
`node/drivers/{ink-renderer,clack-prompter,tab-completions,node-process-runner}.driver.ts(x)`;
`testing/drivers/memory-process-runner.driver.ts`; tests beside each.

## Data models and migrations

None.

## Contracts

`@stackra/console` minor (additive). `@stackra/cli`, `@stackra/mcp`, `@figentra-oss/flow` and `@figentra/cli` change their
output (each changeset says so). The `--json` error gains optional `why`, `fix`, `docs`.

## Error handling

Every failure renders as one `Problem`. `UsageError` → exit 2; `PromptCancelledError` and SIGINT → 130; SIGTERM →
143; a `CommandError` → 1 with its fields; anything else → 1 with its message as the title. Child output goes to the
task's tail and, under `--verbose`, to the problem's `detail`.

## Security and tenancy

No tenancy. Local MCP: only `tool` commands are exposed; read-only hint from the definition; a `secret` field is never
echoed in a tool result or a captured log. The `figentra` secret guards keep matching (spaced names stay spaced).

## Testing strategy

Snapshots per component per driver (colour on/off, unicode/ascii, 40 and 120 columns); routing table tests; a
"same data three ways" test (AC-006); golden completion scripts plus `complete()` cases; a module-load test that a
non-live run never imports `ink`; Flow's and figentra's suites get one test per fixed finding. All on ci-boxes.

## Rollout

PRs in order; each one green on a ci-box before the next. Core first, then a `@stackra/console` prerelease from CI,
then Flow and figentra against it, then the owner-approved release.

| #   | Repo     | PR                                                                                                                                             |
| --- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | core     | #272: docs: this spec and plan; ADR 0506 amendment (deps, ports, Flow adoption); 0282 note; supersede flow-visual-spec                         |
| 2   | core     | folded into 6, 7 and 8: each adds its own catalog entry, lockfile and changeset where it first uses it (an unused entry would trip the checks) |
| 3   | core     | #268: feat(console): router intents, `help <cmd>`, spaced names, grouped list with summaries, `completion` reserved                            |
| 4   | core     | #283: feat(console): Renderer port + `text` driver (existing functions behind it), status table, checklist, tree, problem box, `present`       |
| 5   | core     | #284: feat(console): ProcessRunner port, task failure tail, verbose-only child output, `CommandError`                                          |
| 6   | core     | #285: feat(console): Prompter port class, `clack` driver as the interactive default, field `prompt` and `choices`                              |
| 7   | core     | #286: feat(console): `ink` live driver (task list, spinner, progress, `live`), lazy load and fallback                                          |
| 8   | core     | #287: feat(console): Completions port, `tab` driver, `completion <shell>`                                                                      |
| 9   | core     | #288: feat(console,mcp): `toolsOf`, JSON Schema from fields; `@stackra/mcp` serves tools from definitions                                      |
| 10  | core     | feat(actions,gen): `command` option, `ActionCommand`, after STA-1947 PR 3                                                                      |
| 11  | core     | feat(cli): `stackra` on `createConsole` (with engine-proof's doctor), doctor checklist, status tables, `tool` flags                            |
| 12  | flow     | feat(cli): TypeScript CLI layer on `@stackra/console`: routing, help, unknown, banner, theme                                                   |
| 13  | flow     | fix(doctor): grouped checklist, credentials at warn on a fresh repo, `--json` rows                                                             |
| 14  | flow     | fix(status): tables, named problems, `--verbose`, sessions from live agent sessions                                                            |
| 15  | flow     | fix(spec,gate): `spec paths` slug fallback, non-circular `gate dir` hint, no git noise                                                         |
| 9a  | core     | #289: console's own validate findings and STA-1985 (knip)                                                                                      |
| 9b  | core     | #290: `passthrough: true`, migration only (A-001, FR-031)                                                                                      |
| 16  | figentra | feat(cli): `figentra` on `@stackra/console`, Figentra theme, guards unchanged                                                                  |

Engine-proof (STA-1952) builds doctor and create on PRs 3 to 6; it can start on the port shapes above once agreed, and
its `CliIo` bridge stays valid throughout.

## Delegation and risk plan

I build 1 to 9 and 11; 10 goes to compiler-engineer within the agreed gen boundary. Flow and figentra PRs only after the leader says go
(Flow's 0.3.0 is paused). Risks: Ink and Clack versions (pinned, ≥2 weeks old); the live driver in non-TTY (always text);
drift between the engine-proof branch and PR 4 (agree shapes first).

## ADRs

Amend 0506 (d5, d8, consequences) and note 0282 d5; amend 0294's action options and 0098's v3 note. Number
reservation only if the leader prefers a new ADR over amendments.

## Docs

`guides/console.mdx`, package README and AGENTS.md, the cli README, the superseded notes in STA-1730's
`flow-visual-spec.md` and `adoption.md`.

## Complexity tracking

Four ports, of which ProcessRunner is new and not named by the owner: it is what makes "raw child output only under
`--verbose`" and "tail of a failed step" one behaviour in three CLIs, and what lets the MCP capture child output.
