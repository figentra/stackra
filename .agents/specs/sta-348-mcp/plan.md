# Plan: `@stackra/mcp` wave 2

**Spec**: `.agents/specs/sta-348-mcp/spec.md`

1. **Config** (`src/core/`): one zod schema with the `.mcp.json` shape, so the rendered file is the parsed document;
   `ruleIssues` adds the three rules a shape cannot say; `parseMcpConfig` runs both; `mcpConfigJsonSchema` derives the
   editor schema from the same constant.
2. **Exec** (`src/core/`): `shellCommandLine` single-quotes literals and leaves `"${NAME:?…}"` for the shell;
   `mcpExecCommand` wraps it in `infisical run … -- sh -c` only when a `$NAME` appears (the shape of the repository's
   `tools/scripts/mcp.sh`, without `eval`). `execWithSecrets` (`./node`) spawns it with inherited stdio.
3. **Files** (`src/node/`): `readMcpConfig`, `syncMcpConfig` (write only on change), `checkMcpConfig` (exact text).
4. **Server** (`src/node/`): `connectMcp` frames newline-delimited JSON-RPC both ways and is used for the server and
   the Encore client; `serveLocalMcp` answers `initialize`, `ping`, `tools/list` and `tools/call`, checks tool
   arguments with zod before anything runs, runs commands through the `StackraRunner` option (default
   `spawnStackra`), and forwards `encore_*` calls to `openEncoreMcp`'s peer (app id from the root runway).
5. **Stand-in barrels and authored tool configs** until gen writes them (STA-339), as in wave 1.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                |
| ------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/developer/mcp`; workspace imports: `@stackra/contracts`, `@stackra/runway` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | PASS   | no secret value is read, printed, logged or put on argv; Infisical fills the child's environment                                                    |
| Security                              | PASS   | local writes go through the given `StackraRunner` only (ADR 0282)                                                                                   |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                        |
| Tenancy                               | N/A    | no tenant data                                                                                                                                      |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                              |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                    |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                           |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                   |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                     |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                  |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                             |

## Deploy modes

| Mode       | Behaviour                                                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service                                                              |
| On-prem    | identical: the same build, no SaaS-only code path                                                                             |
| Air-gapped | identical: the package itself makes no network call; the servers a consumer names in its MCP config are the consumer's choice |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.` and `./node` — Validates: FR-001
- **P-002**: `.` exports `parseMcpConfig`, `renderMcpJson`, `mcpExecCommand`, `shellCommandLine`, `secretNamesOf`, `mcpConfigJsonSchema`, `McpConfigInvalidError` and the config, issue, exec option and command-line types — Validates: FR-002
- **P-003**: `./node` exports `syncMcpConfig`, `checkMcpConfig`, `readMcpConfig`, `execWithSecrets`, `serveLocalMcp`, `McpProtocolError` and the peer, runner, outcome and options types — Validates: FR-003
- **P-004**: `syncMcpConfig` writes local files only through the `StackraRunner` it is given — Validates: FR-004
- **P-005**: `mcpExecCommand` puts secret names, never values, into the command it builds, so no value is read, printed, logged or placed on the Stackra process's argv — Validates: FR-005
