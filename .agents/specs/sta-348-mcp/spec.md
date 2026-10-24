# Feature Specification: `@stackra/mcp` wave 2, the local developer MCP

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: resolved (ADR 0282 decision 5 sets the local mode; owner 2026-10-24: `stackra mcp` proxies
the local Encore tools; ADR 0127 2026-10-24 note places `mcp` in `developer` and sets the entries)

**Input**: Build `@stackra/mcp` (developer, wave 2) for real: what the template's `stackra mcp`, `stackra mcp sync` and
`stackra mcp exec --` need, as a library `@stackra/cli` wires.

## Impact

- **Apps touched**: none (the template's root `package.json` `prepare` and `.mcp.yaml` consume it through the CLI)
- **Services touched**: none
- **Packages touched**: `packages/developer/mcp` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: names only. `stackra mcp exec` hands a server its values through `infisical run` and the child's own
  shell; no value passes through the Stackra process, its output or its arguments
- **ADR needed**: no (ADR 0282 decisions 3, 5, 9 and 10; ADR 0173; ADR 0257)
- **New dependencies**: none outside the catalogs (`zod`, `yaml` from the default catalog; workspace `@stackra/contracts`,
  `@stackra/runway`). The MCP SDK is not used: the server speaks the stdio framing directly
- **Deploy modes**: same in all; developer tooling only
- **Lane**: full (a new package)
- **Change risk**: R2 (new public contract; starts processes and handles secret names, never values)

## User Scenarios & Testing

### User Story 1 - `.mcp.yaml` renders into `.mcp.json` (Priority: P1)

`pnpm install` runs `stackra mcp sync` through `prepare`; `stackra agents check` fails on drift.

**Independent Test**: `src/core/functions/__tests__/{parse-mcp-config,rule-issues,render-mcp-json,mcp-config-json-schema}.function.test.ts`,
`src/node/functions/__tests__/{read-mcp-config,sync-mcp-config,check-mcp-config}.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** the template's `.mcp.yaml`, **When** `syncMcpConfig` runs, **Then** `.mcp.json` holds the same servers in
   file order, and a second run reports no change.
2. **Given** a `$NAME` outside `stackra mcp exec --`, in env, or in a remote server, or an npx package without an exact
   version, **Then** the check fails naming the server and a snake_case code.
3. **Given** a hand-edited `.mcp.json`, **Then** `checkMcpConfig` returns false.

### User Story 2 - `stackra mcp exec --` launches a server with its secrets (Priority: P1)

**Independent Test**: `src/core/functions/__tests__/{secret-names-of,shell-command-line,mcp-exec-command}.function.test.ts`,
`src/node/functions/__tests__/exec-with-secrets.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** arguments without a `$NAME`, **Then** the command starts unchanged.
2. **Given** `--api-key $CONTEXT7_API_KEY`, **Then** it runs under `infisical run --env=dev --path=/agents --silent`,
   the shell expands the reference, literals stay inert, and an unset name fails naming it.

### User Story 3 - `stackra mcp` serves the repository to an assistant (Priority: P1)

**Independent Test**: `src/node/functions/__tests__/{connect-mcp,serve-local-mcp,open-encore-mcp,read-manifests,spawn-stackra}.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** an MCP client on stdio, **When** it initializes and lists tools, **Then** it gets `manifest`, `new`, `gen`,
   `validate`, `verify` and every local Encore tool under `encore_`.
2. **Given** a `new`, `gen`, `validate` or `verify` call, **Then** it runs through the CLI runner (the CLI's gates)
   and a non-zero exit is an error result with the output's tail.
3. **Given** invalid arguments or an unknown tool, **Then** the call is refused with `-32602` and nothing runs.
4. **Given** no root runway, no Encore app or no Encore CLI, **Then** the local tools still work.

## Requirements

- **FR-001**: Entries `.` and `./node` only (ADR 0127 2026-10-24 note); one symbol per entry.
- **FR-002**: `.` exports `parseMcpConfig`, `renderMcpJson`, `mcpExecCommand`, `shellCommandLine`, `secretNamesOf`,
  `mcpConfigJsonSchema`, `McpConfigInvalidError` and the config, issue, exec option and command line types.
- **FR-003**: `./node` exports `syncMcpConfig`, `checkMcpConfig`, `readMcpConfig`, `execWithSecrets`, `serveLocalMcp`,
  `McpProtocolError` and the peer, runner, outcome and options types.
- **FR-004**: Local writes go through the given `StackraRunner` only (ADR 0282 enforcement).
- **FR-005**: No secret value is read, printed, logged or put on the Stackra process's argv.

## Success Criteria

- **SC-001**: The template's `stackra mcp`, `stackra mcp sync` and `stackra mcp exec --` uses have a library function
  each; the template's `.mcp.yaml` passes the check.
- **SC-002**: Every public symbol has a test in a `__tests__/` folder beside it.
- **SC-003**: `pnpm verify` green for the member (run in the separate testing workflow).

## Out of scope

- The `stackra` binary and its argument parsing: `@stackra/cli`.
- The hosted mode (`mcp.stackra.figentra.com`, OAuth, read-only docs and project data) and its approval-gated writes:
  a separate deployment.
- Read-only spec status (ADR 0282 decision 15): waits for the CLI's `spec` command (Vellum, STA-298).
- Rendering `.mcp.yaml` for tools other than Claude Code: `stackra agents setup` with `@stackra/renderers`.
