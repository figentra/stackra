# Implementation Plan: the developer MCP describes only what exists and serves real commands as tools

**Spec**: `.agents/specs/sta-2873-dev-mcp-tools/spec.md` · **Linear**: STA-2873 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2873-dev-mcp-tools/spec.md`

## Summary

`LOCAL_TOOLS` and `readManifests` go. Each local tool becomes a `@stackra/console` command declared `tool` under
`packages/developer/mcp/src/node/commands/`, listed in `DEV_TOOL_COMMANDS` and served by `serveLocalMcp` through
`toolsOf`, with a tool container that builds each command with a `DevToolHost` (the CLI runner and the environment).
Readers (`app_info`, `manifest`, `routes`) read committed files; runners (`new`, `gen`, `validate`, `check`, `verify`,
`test`, `typecheck`, `lint`) run the CLI through the host, in a member's folder when named, and add what they parse
from the output. `toolsOf` carries `destructive` and `idempotent` hints, and the server lists all three annotations.
A writing tool is refused on a deployed target (`deployedTarget`). The Encore list follows `nextCursor`
(`listUpstreamTools`). `@stackra/cli` declares `ls` a tool, passes it to the server, and lets its runner run in a folder.

## Technical Context

- **Language**: TypeScript (ESM), Node 24
- **Members**: `packages/developer/mcp`, `packages/developer/console`, `packages/developer/cli`
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); the server tests drive real stdio streams with a fake runner
- **Storage**: none
- **Runtime target**: node (the server and its commands); the `DevToolHost` port is isomorphic

## Constitution Check

| Law                                   | Result | Note                                                                                       |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | `@stackra/mcp` → `@stackra/console`, `@stackra/validation` (same developer tier, no cycle) |
| Secrets (ADR 0009)                    | PASS   | no secret read; `app_info` returns provider names only                                     |
| Security                              | PASS   | writes refused on a deployed target; no shell; output capped                               |
| HTTP and events                       | N/A    | no route, header or event changes                                                          |
| Tenancy                               | N/A    | local developer tooling, never a tenant tool (ADR 0155)                                    |
| Delegation                            | PASS   | one session, one branch                                                                    |
| Not built yet (ADR 0011)              | PASS   | nothing from the table                                                                     |
| Test placement (ADR 0022)             | PASS   | tests sit in `__tests__/` beside each changed file                                         |
| Versions and catalogs                 | PASS   | workspace dependencies only                                                                |
| Deploy modes (ADR 0076)               | N/A    | developer tooling                                                                          |
| Licence tier (ADR 0077)               | PASS   | free                                                                                       |
| Docs and ADRs                         | PASS   | README, AGENTS.md, two docs pages in both languages, a changeset; implements ADR 0282 d5   |

## Deploy modes

| Mode       | Behaviour                                                                 |
| ---------- | ------------------------------------------------------------------------- |
| SaaS       | not deployed; in a deployed runtime (`STACKRA_ENVIRONMENT`) writes refuse |
| On-prem    | same                                                                      |
| Air-gapped | same                                                                      |

## Correctness properties

- **P-001**: the set of `new` kinds offered equals the set `stackra new` names, and the `check` phases offered equal `CHECK_PHASES` in order — Validates: FR-002
- **P-002**: every property of a runner tool is a flag of the CLI command it runs, except `member`, `kind` and `name` — Validates: FR-002
- **P-003**: for every call of a tool that is not read-only with a non-local environment, no runner call happens and the result is `deployed_target` — Validates: FR-008
- **P-004**: for every chain of `tools/list` pages, the served Encore tools are the concatenation of every page up to a repeated or absent cursor — Validates: FR-009
- **P-005**: a read-only tool resolves to `destructive: false, idempotent: true`; `tool: true` to `false, true, false` (readOnly, destructive, idempotent) — Validates: FR-007

## Architecture overview

`serveLocalMcp` builds the built-in tools with `toolsOf({ commands: DEV_TOOL_COMMANDS, container })`, merges the
host's tools over them by name, and dispatches `tools/call` to `invoke` after the deployed-target check. A runner tool's
handler calls `runToolCommand`, which resolves the member, runs `host.run(args, { cwd })` through `toolRun` (timing,
colour stripping, tail cap) and writes `{ ...result, ...read(output) }` as the `--json` data; its exit code becomes the
tool's `isError`. `listUpstreamTools` walks Encore's pages once, at start.

## Components and responsibilities

- `DevToolHost` (`src/core/ports/dev-tool-host.port.ts`): `run(args, { cwd })` and `environment()`.
- `devToolContainer` (`src/node/functions/dev-tool-container.function.ts`): builds each tool command with the host.
- Commands (`src/node/commands/*.command.ts`): `AppInfoCommand`, `ManifestCommand`, `RoutesCommand`, `NewCommand`,
  `GenCommand`, `ValidateCommand`, `CheckCommand`, `VerifyCommand`, `TestCommand`, `TypecheckCommand`, `LintCommand`.
- Constants: `DEV_TOOL_COMMANDS`, `NEW_KINDS`, `CHECK_PHASE_NAMES`, `LOCAL_ENVIRONMENTS`, `OUTPUT_LIMIT`.
- Functions: `runToolCommand`, `toolRun`, `readMembers`, `resolveMember`, `deployedTarget`, `listUpstreamTools`,
  `parseTestOutput`, `parseDiagnostics`, `parseGenOutput`, `parseCheckOutput`, `checkReport`, `diagnosticsOf`.
- `@stackra/console`: `readCommand` resolves the hints (`toolHints`); `toolsOf` and `ConsoleTool` carry them.
- `@stackra/cli`: `LsCommand` declares `tool: { readOnly: true }`; `MCP_COMMAND` passes `doctor` and `ls` and a runner
  that takes `{ cwd }`; `runCli`'s `context.cli` runs in a given folder.

## Files and folders

```text
packages/developer/mcp/
├── AGENTS.md
├── README.md
├── package.json
├── stackra.manifest.json
└── src/
    ├── core/
    │   ├── index.ts
    │   └── ports/dev-tool-host.port.ts
    └── node/
        ├── index.ts
        ├── commands/ (11 tool commands)
        ├── constants/ (dev-tool-commands, new-kinds, check-phase-names, local-environments, output-limit)
        ├── functions/ (run-tool-command, tool-run, read-members, resolve-member, deployed-target,
        │               list-upstream-tools, dev-tool-container, parse-*, check-report, diagnostics-of,
        │               serve-local-mcp, spawn-stackra, and their __tests__)
        └── types/ (diagnostic, test-summary, tool-run-result, upstream-tool, workspace-member, local-tool,
                    serve-local-mcp-options, stackra-runner)
packages/developer/console/src/
├── contracts/types/command-options.type.ts
├── contracts/types/command-structure.type.ts
└── core/
    ├── functions/read-command.function.ts
    ├── functions/tools-of.function.ts
    ├── functions/__tests__/tools-of.function.test.ts
    └── types/console-tool.type.ts
packages/developer/cli/src/node/
├── commands/ls.command.ts
├── constants/mcp-command.constant.ts
├── constants/__tests__/mcp-command.constant.test.ts
├── functions/run-cli.function.ts
└── types/cli-context.type.ts
apps/docs/src/docs/
├── cli.mdx, cli.ar.mdx
└── clients-and-tools.mdx, clients-and-tools.ar.mdx
.changeset/dev-mcp-truthful-tools.md
```

- `packages/developer/mcp/src/node/functions/serve-local-mcp.function.ts`
- `packages/developer/mcp/src/node/constants/dev-tool-commands.constant.ts`
- `packages/developer/console/src/core/functions/read-command.function.ts`
- `packages/developer/cli/src/node/constants/mcp-command.constant.ts`

## Data models and migrations

none

## Contracts

- `CommandOptions.tool?: boolean | { readOnly: boolean; destructive?: boolean; idempotent?: boolean }`.
- `CommandStructure.tool?: { readOnly: boolean; destructive: boolean; idempotent: boolean }`.
- `ConsoleTool.destructive: boolean`, `ConsoleTool.idempotent: boolean`.
- `@stackra/mcp`: `DevToolHost` (abstract port), `DEV_TOOL_COMMANDS: readonly CommandClass[]`, types `Diagnostic`,
  `TestSummary`, `ToolRunResult`; `LocalTool.destructive?`, `LocalTool.idempotent?`;
  `StackraRunner = (args, options?: { cwd?: string }) => Promise<CommandOutcome>`; `ServeLocalMcpOptions.env?`.
- `@stackra/cli`: `CliContext.cli(args, io, options?: { cwd?: string })`.
- Callers: `@stackra/cli`'s `MCP_COMMAND` (updated here); no other workspace member calls these.

## Error handling

A tool's bad input or failing command is a tool result with `isError: true` and the command's error document; an
unknown tool is a JSON-RPC `-32602`. A deployed-target refusal is `{ ok: false, error: { code: "deployed_target",
message, fix } }`. An upstream Encore failure leaves the local tools working.

## Security and tenancy

Writes go only through the CLI's commands and gates (ADR 0282 decision 5). No tool takes a shell string: arguments are
passed as an argv array, every option as `--flag=value`. `new` does not offer `--repo`; `lint` and `check` never pass
`--fix`. `app_info` reads no secret and returns provider names only. Writes refuse on a deployed target.

## Testing strategy

- AC-001: `mcp-command.constant.test.ts` ("offer exactly the kinds stackra new makes", "offer exactly the phases
  stackra check runs", "pass only flags the CLI command they run takes").
- AC-002: `serve-local-mcp.function.test.ts` ("reads manifests by member and section…", "answers the app facts…",
  "lists the HTTP endpoints…").
- AC-003: "runs new, gen, validate and verify through the CLI runner with structured results" and "runs test,
  typecheck, lint and check in a member and reads their results" (failing and passing output), plus the parser tests.
- AC-004: "refuses a writing tool on a deployed target and still answers a read-only one", `deployed-target` tests.
- AC-005: "proxies every page of Encore tools under encore_…", `list-upstream-tools` tests.
- AC-006: "answers the handshake and lists the built-in tools in order with their hints", `tools-of` hint test.
- Revert checks: each guarded behaviour mutated in turn makes its test fail (kinds, phases, guard, paging, hints,
  section check, member folder).
- Manual: the built `stackra mcp` driven over stdio in this repository on box 2.

## Rollout

Minor changesets for `@stackra/mcp`, `@stackra/console` and `@stackra/cli`. Agents get the new tools on their next
`stackra mcp` start; `.mcp.json` does not change.

## Delegation and risk plan

One session, one branch. Budget: medium (one PR). Coordinate with batch DX1 (CLI passthrough port): rebase if it
merges first; the CLI change is the `ls` flag, the wiring line and the runner's folder.

## ADRs

ADR 0282 decision 5 (local mode), R-29 (Encore proxy), ADR 0155 (tenant tools stay on the action path), ADR 0022 (test
placement), ADR 0294 decision 25 (ports): all Accepted.

## Docs

`packages/developer/mcp/README.md`, `packages/developer/mcp/AGENTS.md`, `apps/docs/src/docs/cli.mdx`,
`apps/docs/src/docs/cli.ar.mdx`, `apps/docs/src/docs/clients-and-tools.mdx`,
`apps/docs/src/docs/clients-and-tools.ar.mdx`, `.changeset/dev-mcp-truthful-tools.md`.

## Complexity tracking

none
