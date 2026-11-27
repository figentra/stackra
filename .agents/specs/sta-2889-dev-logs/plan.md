# Implementation Plan: a dev log `stackra dev` writes, and the `logs`, `last_error` and `browser_logs` MCP tools

**Spec**: `.agents/specs/sta-2889-dev-logs/spec.md` · **Linear**: STA-2889 · **Date**: 2026-11-27

**Input**: Feature specification from `.agents/specs/sta-2889-dev-logs/spec.md`

## Summary

`@stackra/runway` owns the dev log beside the dev facts: its path (`DEV_LOG_PATH`), its entry (`DevLogEntry`), the one
writer (`appendDevLog`: redact with `@stackra/logger`'s `redact`, cut long text, rotate at 5 MiB) and the reader
(`readDevLog`). `@stackra/cli`'s `toolCommand("dev")` hands `runProcess` a tee (`devLogTee`) that splits the tool's
output into lines and levels them (`devLogEntryOf`); `runProcess` pipes a teed run's output, keeping the terminal's
input and colour. `@stackra/vite-plugin` adds `browserLogsPlugin` to `corePlugins` (`apply: "serve"`): it appends a
client to Vite's own client module and answers `/__stackra/browser-log` after `browserLogRefusal`, writing
`browserLogEntries` through `appendDevLog`. `@stackra/mcp` adds `LogsCommand`, `LastErrorCommand` and
`BrowserLogsCommand` to `DEV_TOOL_COMMANDS`, reading through `devLogQuery` and `parseSince`.

## Technical Context

- **Language**: TypeScript (ESM), Node 24
- **Members**: `packages/developer/runway`, `packages/developer/cli`, `packages/developer/mcp`,
  `packages/developer/vite-plugin`
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); the tool tests drive the local server over in-memory stdio;
  the plugin tests drive its middleware with real `IncomingMessage` / `ServerResponse` pairs; the client test runs the
  script against a simulated page
- **Storage**: the machine-local file `.stackra/logs/dev.ndjson` (gitignored)
- **Runtime target**: node (writer, reader, tee, middleware, tools); the browser (the client script, dev server only)

## Constitution Check

| Law                                   | Result | Note                                                                                                    |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | runway and vite-plugin → `@stackra/logger` (foundation below developer); cli, mcp, vite-plugin → runway |
| Secrets (ADR 0009)                    | PASS   | no secret read; every entry redacted before it is written                                               |
| Security                              | PASS   | same-origin JSON POST with a custom header only; size and count limits; dev server only; no shell       |
| HTTP and events                       | PASS   | one dev-server-only route, never in a build; no event                                                   |
| Tenancy                               | N/A    | local developer tooling, never a tenant tool (ADR 0155)                                                 |
| Delegation                            | PASS   | one session, one branch                                                                                 |
| Not built yet (ADR 0011)              | PASS   | nothing from the table                                                                                  |
| Test placement (ADR 0022)             | PASS   | tests sit in `__tests__/` beside each changed file                                                      |
| Versions and catalogs                 | PASS   | workspace dependencies only                                                                             |
| Deploy modes (ADR 0076)               | N/A    | developer tooling                                                                                       |
| Licence tier (ADR 0077)               | PASS   | free                                                                                                    |
| Docs and ADRs                         | PASS   | three READMEs, two docs pages in both languages, a changeset; implements ADR 0282 d5 within ADR 0296    |

## Deploy modes

| Mode       | Behaviour                                                     |
| ---------- | ------------------------------------------------------------- |
| SaaS       | not deployed; the browser log plugin never applies to a build |
| On-prem    | same                                                          |
| Air-gapped | same                                                          |

## Correctness properties

- **P-001**: for every entry written, the stored entry equals `redact(entry)` with `message` and `stack` cut to 8000 characters — Validates: FR-003
- **P-002**: for every sequence of appends, the dev log file is at most 5 MiB plus one write, and `readDevLog` returns the rotated entries then the current ones — Validates: FR-004
- **P-003**: for every chunking of a tool's output, the teed lines equal the output's non-blank lines in order — Validates: FR-001
- **P-004**: an indented line's level equals the level of the line before it on the same stream — Validates: FR-002
- **P-005**: for every request that is not a same-origin JSON POST with the client header, nothing is appended — Validates: FR-006
- **P-006**: a browser entry's `url` never holds a query or fragment — Validates: FR-005
- **P-011**: for every console report with `args`, the written message equals the redacted args joined as text, so no field the logger masks by name appears in it — Validates: FR-005, FR-003
- **P-007**: `logs` with `limit` n answers the last n matching entries and `earlier` equals the matching count minus n (at least 0) — Validates: FR-007
- **P-008**: `last_error` answers the latest error entry's block (only server lines group; a browser report is a block of one), or `error: null` when no entry is an error — Validates: FR-008
- **P-009**: every report `browser_logs` answers is a `browser` entry matching its kind, lowest level, member, time and text, without `source` or `stream` — Validates: FR-009
- **P-010**: for every tool of the three, a repository with no dev log answers a tool error whose fix names `stackra dev`, and nothing is written — Validates: FR-010

## Architecture overview

```text
member dev tool ──stdout/stderr──▶ runProcess ──▶ terminal (io)
                                        └─tee──▶ devLogTee ─▶ devLogEntryOf ─▶ appendDevLog ─┐
page (Vite client + browserLogClient) ─POST /__stackra/browser-log─▶ browserLogsPlugin      │
     browserLogRefusal → browserLogEntries ─▶ appendDevLog ─────────────────────────────────┤
                                                       redact · cut · rotate                ▼
                                                              <root>/.stackra/logs/dev.ndjson
                                                                                            │
stackra mcp: logs · last_error · browser_logs ─▶ devLogQuery ─▶ readDevLog ◀───────────────┘
```

## Components and responsibilities

- `@stackra/runway`: `DEV_LOG_PATH`, `DEV_LOG_MAX_BYTES`, `DEV_LOG_MAX_TEXT`, `DevLogEntry`, `devLogFile`,
  `appendDevLog`, `readDevLog`, `rotatedDevLog`.
- `@stackra/cli`: `devLogEntryOf` (line → entry), `devLogTee` and `DevLogTee` (chunks → lines → appends), `ToolRun.tee`,
  `runProcess` (pipe a teed run), `toolCommand("dev")` (wire the tee, write the end line).
- `@stackra/vite-plugin`: `BROWSER_LOG_ROUTE`, `BROWSER_LOG_LIMITS`, `browserLogClient`, `browserLogRefusal`,
  `browserLogEntries`, `browserLogsPlugin`, `corePlugins`.
- `@stackra/mcp`: `LogsCommand`, `LastErrorCommand`, `BrowserLogsCommand`, `DEV_LOG_LEVELS`, `DevLogFilter`,
  `devLogQuery`, `parseSince`, `DEV_TOOL_COMMANDS`.

## Files and folders

```text
.changeset/
└── dev-log-mcp-tools.md
.agents/specs/sta-2889-dev-logs/
├── spec.md
├── plan.md
└── tasks.md
apps/docs/src/docs/
├── cli.mdx
├── cli.ar.mdx
├── clients-and-tools.mdx
└── clients-and-tools.ar.mdx
packages/developer/runway/
├── README.md
├── package.json
└── src/
    ├── core/
    │   ├── index.ts
    │   ├── __tests__/index.test.ts
    │   ├── constants/
    │   │   ├── dev-log-max-bytes.constant.ts
    │   │   ├── dev-log-max-text.constant.ts
    │   │   └── dev-log-path.constant.ts
    │   └── types/dev-log-entry.type.ts
    └── node/
        ├── index.ts
        ├── __tests__/index.test.ts
        └── functions/
            ├── append-dev-log.function.ts
            ├── dev-log-file.function.ts
            ├── read-dev-log.function.ts
            ├── rotated-dev-log.function.ts
            └── __tests__/append-dev-log.function.test.ts
packages/developer/cli/
├── package.json
└── src/node/
    ├── functions/
    │   ├── dev-log-entry-of.function.ts
    │   ├── dev-log-tee.function.ts
    │   ├── run-process.function.ts
    │   ├── tool-command.function.ts
    │   └── __tests__/
    │       ├── dev-log-entry-of.function.test.ts
    │       ├── dev-log-tee.function.test.ts
    │       ├── run-process.function.test.ts
    │       └── tool-command.function.test.ts
    └── types/
        ├── dev-log-tee.type.ts
        └── tool-run.type.ts
packages/developer/mcp/
├── README.md
├── package.json
├── stackra.manifest.json
└── src/node/
    ├── commands/
    │   ├── browser-logs.command.ts
    │   ├── last-error.command.ts
    │   ├── logs.command.ts
    │   └── __tests__/
    │       ├── browser-logs.command.test.ts
    │       ├── dev-log-repository.fixture.ts
    │       ├── last-error.command.test.ts
    │       └── logs.command.test.ts
    ├── constants/
    │   ├── dev-log-levels.constant.ts
    │   └── dev-tool-commands.constant.ts
    ├── functions/
    │   ├── dev-log-query.function.ts
    │   ├── parse-since.function.ts
    │   └── __tests__/
    │       ├── parse-since.function.test.ts
    │       └── serve-local-mcp.function.test.ts
    └── types/dev-log-filter.type.ts
packages/developer/vite-plugin/
├── README.md
├── package.json
└── src/core/
    ├── constants/
    │   ├── browser-log-limits.constant.ts
    │   └── browser-log-route.constant.ts
    └── functions/
        ├── browser-log-client.function.ts
        ├── browser-log-entries.function.ts
        ├── browser-log-refusal.function.ts
        ├── browser-logs-plugin.function.ts
        ├── core-plugins.function.ts
        └── __tests__/
            ├── browser-log-client.function.test.ts
            ├── browser-log-entries.function.test.ts
            ├── browser-logs-plugin.function.test.ts
            ├── bundle-config.function.test.ts
            ├── core-plugins.function.test.ts
            ├── stackra.function.test.ts
            └── vite-config.function.test.ts
pnpm-lock.yaml
```

## Data models and migrations

none (one machine-local NDJSON file; `DevLogEntry` is its line shape)

## Contracts

- `@stackra/runway`: `DEV_LOG_PATH = ".stackra/logs/dev.ndjson"`; `DevLogEntry = { time; source: "server" | "browser";
level: "debug" | "info" | "warn" | "error"; member; message; stream?; kind?; url?; stack?; fields? }`;
  `devLogFile(from: string): string`; `appendDevLog(file: string, entries: readonly DevLogEntry[]): void`;
  `readDevLog(file: string): DevLogEntry[]`.
- `@stackra/cli`: `ToolRun.tee?: (stream: "stdout" | "stderr", text: string) => void`.
- `@stackra/vite-plugin`: `corePlugins()` ends with `stackra:browser-logs`; route `POST /__stackra/browser-log` with
  body `{ entries: [{ kind, level, message, stack?, url?, time? }] }`, answering 204, or 400 / 403 / 405 / 413 / 415 /
  500 with a plain-text reason.
- `@stackra/mcp` tools: `logs { source?, level?, member?, since?, search?, limit? }` →
  `{ file, entries, earlier }`; `last_error { source?, member?, since?, context? }` →
  `{ file, error, lines?, before, after }` or `{ file, error: null, checked }`;
  `browser_logs { kind?, level?, member?, since?, search?, limit? }` → `{ file, reports, earlier }`.
- Callers: `toolCommand("dev")` (cli), `corePlugins` (vite-plugin), the three tool commands (mcp).

## Error handling

A dev log the tee cannot write is reported once on stderr and the tee goes quiet; the dev tool keeps running. The
middleware answers an error status and never stops the dev server. A missing dev log, a bad `since` or an unknown
member is a `CommandError` with a fix, which the local server returns as a tool error.

## Security and tenancy

Redaction happens in the one writer, so neither the tee nor the browser route can skip it. The route refuses before
reading the body; a cross-site page cannot add the custom header without a CORS preflight the dev server never
answers, and `Sec-Fetch-Site` / `Origin` are checked as well. The page URL loses its query and fragment. Nothing a
page sends is executed. The tools mark their output as data, never instructions.

## Testing strategy

- AC-001: `tool-command.function.test.ts` ("copies a member's dev output into the repository's dev log, redacted"),
  `dev-log-tee.function.test.ts`, `dev-log-entry-of.function.test.ts`, `run-process.function.test.ts` ("hands every
  chunk to the tee by stream and still to the io").
- AC-002: `append-dev-log.function.test.ts` (redaction, cut, rotation, reader).
- AC-003: `browser-logs-plugin.function.test.ts` (serve only, client added, same-origin write, cross-site and size
  refusals), `browser-log-entries.function.test.ts` (shape, page URL, refusal), `browser-log-client.function.test.ts`.
- AC-004: `logs.command.test.ts`, `last-error.command.test.ts`, `browser-logs.command.test.ts` over stdio;
  `parse-since.function.test.ts`; the tool list order in `serve-local-mcp.function.test.ts`.
- Revert checks: removing the tee from `toolCommand("dev")`, the plugin from `corePlugins`, or the refusal from the
  middleware makes its test fail.

## Rollout

Minor changesets for `@stackra/runway`, `@stackra/cli`, `@stackra/mcp` and `@stackra/vite-plugin`. A product gets the
dev log on its next `stackra dev` and the tools on its next `stackra mcp` start; `.mcp.json` does not change.

## Delegation and risk plan

One session, one branch, stacked on STA-2873 (PR #1172). Budget: medium (one PR). Rebase onto `main` once #1172
merges.

## ADRs

ADR 0282 decision 5 (local mode explains failures), ADR 0296 decision 1 (dev facts under `.stackra/`), ADR 0147
decision 1 (redaction), ADR 0184 decision 5 (no personal data in logs), ADR 0261 decision 4 (preset plugins), ADR 0022
(test placement), ADR 0305 (one declaration per file): all Accepted.

## Docs

`packages/developer/mcp/README.md`, `packages/developer/runway/README.md`, `packages/developer/vite-plugin/README.md`,
`apps/docs/src/docs/cli.mdx`, `apps/docs/src/docs/cli.ar.mdx`, `apps/docs/src/docs/clients-and-tools.mdx`,
`apps/docs/src/docs/clients-and-tools.ar.mdx`, `.changeset/dev-log-mcp-tools.md`.

## Complexity tracking

none
