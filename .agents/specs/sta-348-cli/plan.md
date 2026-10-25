# Plan: `@stackra/cli` wave 3

**Spec**: `.agents/specs/sta-348-cli/spec.md`

1. **Command core** (`src/node/functions/`): a `CliCommand` is data plus `run` (the folded `console` framework);
   `findCommand` picks the longest name, `runCli` parses with `node:util` `parseArgs` (strict, `--` passthrough), runs
   the command and maps outcomes to exit codes. `CliIo` carries output, so the binary (`PROCESS_IO`) and the MCP
   (`captureIo`) share one core.
2. **Gen** (`runGen`, `GEN_COMMAND`): `generate` from `@stackra/gen/node`, refusals through `formatGenError`; at the
   workspace root, every `stackra.config.ts` member from `pnpm-workspace.yaml` (`workspaceMembers`, `node:fs`
   `globSync`).
3. **Tools** (`readMember`, `resolveTool`, `toolCommand`, `runProcess`): layout from the `define*` call, targets from
   the manifest gen just wrote; one closed switch per task picks the tool and passes `.stackra/<tool>` configs that
   exist; the workspace root fans out through `turbo run`.
4. **ls** (`LS_COMMAND`, `MANIFEST_IDENTITIES`): read committed manifests, print identities.
5. **MCP and agents**: thin commands over `serveLocalMcp`, `syncMcpConfig`, `checkMcpConfig`, `execWithSecrets`.
6. **Binary**: `src/node/stackra.ts`, built by tsdown to `dist/stackra.mjs`. Authored tool configs until STA-339.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                             |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/developer/cli`; workspace imports: `@stackra/contracts`, `@stackra/gen`, `@stackra/mcp` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | PASS   | `stackra mcp exec` starts the command under Infisical, so the CLI never reads, prints or logs a value                                                            |
| Security                              | PASS   | tools start with no shell and a controlled `PATH`                                                                                                                |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                                     |
| Tenancy                               | N/A    | no tenant data                                                                                                                                                   |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                           |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                                 |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                        |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                                |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                  |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                               |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                          |

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service |
| On-prem    | identical: the same build, no SaaS-only code path                |
| Air-gapped | identical: needs no network at build or run                      |

## Correctness properties

- **P-001**: `package.json` has `bin.stackra` and lists no code entry in `exports` — Validates: FR-001
- **P-002**: `runGen` calls `generate` from `@stackra/gen/node` and reports a refusal through `formatGenError`, and the package holds no copy of gen — Validates: FR-002
- **P-003**: the `mcp` and agent commands read and write MCP and agent files only through `@stackra/mcp/node` (`serveLocalMcp`, `syncMcpConfig`, `checkMcpConfig`) — Validates: FR-003
- **P-004**: `runProcess` starts a tool with no shell and puts each `node_modules/.bin` above the member first on `PATH` — Validates: FR-004
- **P-005**: `COMMANDS` holds no Figentra-internal operation, and no source file imports a `@stackra-pro/*` package — Validates: FR-005
