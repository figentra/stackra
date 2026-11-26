# Implementation Plan: MCP server secrets reach the environment, never argv

**Spec**: `.agents/specs/sta-1617-mcp-secrets-off-argv/spec.md` · **Linear**: STA-1617 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-1617-mcp-secrets-off-argv/spec.md`

## Summary

Both launchers stop expanding secret references into a server's arguments. Each declares the names a server reads with
`--env NAME[,NAME…]`; the value is decrypted by sops into the server's environment, where the server reads it, and a
`$NAME` left on the command line is refused. In this repository `tools/scripts/mcp.sh` passes the declared names to
`secrets-exec.mjs`, which loses `--expand-args`; `.mcp.yaml` declares each server's token and pins the server versions
whose environment handling was read; GitHub's header comes from a committed mcp-remote `--header-file` with a
`${GITHUB_PERSONAL_ACCESS_TOKEN}` placeholder. In `@stackra/mcp` and `@stackra/cli`, `stackra mcp exec --env` feeds
`McpExecOptions.secrets`, `mcpExecCommand` refuses references and runs `argv` quoted with no expansion, and the
`.mcp.yaml` check reports `secret_on_argv`.

## Technical Context

- **Language**: TypeScript (ESM), Node 24; Bash for `mcp.sh`; plain Node `.mjs` for `tools/scripts`
- **Members**: `packages/developer/mcp` (`@stackra/mcp`), `packages/developer/cli` (`@stackra/cli`),
  `packages/developer/flow-preset` (rule text); repository tooling in `tools/scripts`
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); `node --test tools/scripts/__tests__/*.test.mjs` in
  `pnpm validate`, with a fake `sops` and a fake `npx` on PATH
- **Storage**: none
- **Runtime target**: node (developer machines)

## Constitution Check

| Law                                   | Result | Note                                                                          |
| ------------------------------------- | ------ | ----------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `@stackra/cli` already depends on `@stackra/mcp`; nothing new                 |
| Secrets (ADR 0009, ADR 0525)          | PASS   | names only; values reach a child's environment only, never argv or a file     |
| Security                              | PASS   | closes the argv exposure; refusals name secrets, never values                 |
| HTTP and events                       | N/A    | no route, header or event changes                                             |
| Tenancy                               | N/A    | no tenant data                                                                |
| Delegation                            | PASS   | one session, one branch                                                       |
| Not built yet (ADR 0011)              | PASS   | nothing from the table                                                        |
| Test placement (ADR 0022)             | PASS   | tests sit in `__tests__/` beside each changed file                            |
| Versions and catalogs                 | PASS   | no dependency added; MCP servers pinned in `.mcp.yaml` (npx, not the catalog) |
| Deploy modes (ADR 0076)               | PASS   | developer tooling, same everywhere                                            |
| Licence tier (ADR 0077)               | PASS   | free                                                                          |
| Docs and ADRs                         | PASS   | READMEs, runbooks, rules and changesets; no ADR change needed                 |

## Deploy modes

| Mode       | Behaviour                                                 |
| ---------- | --------------------------------------------------------- |
| SaaS       | developer tooling only; no deployed service changes       |
| On-prem    | same                                                      |
| Air-gapped | same (the launchers decrypt from the local secrets clone) |

## Correctness properties

- **P-001**: for every `.mcp.yaml` server that starts through `mcp.sh` and every canary value of a declared or referenced name, the server's recorded argv never contains the canary, and each declared name's canary is in its environment — Validates: FR-001, FR-004
- **P-002**: for every `mcp.sh` argument list holding `$NAME` or `${NAME}`, the launcher exits 2 and neither sops nor the server runs — Validates: FR-002
- **P-003**: `secrets-exec.mjs` starts its child with exactly the arguments it was given, and refuses `--expand-args` — Validates: FR-003
- **P-004**: for every `argv` without a reference and every set of `--env` names, `mcpExecCommand` returns a command whose arguments contain no `$`, and the started server's argv never holds a value — Validates: FR-005
- **P-005**: for every `argv` with a reference, or a name that is not SCREAMING_SNAKE, `mcpExecCommand` throws and the message never contains the bad name — Validates: FR-006
- **P-006**: `ruleIssues` reports `secret_on_argv` for every local server with a reference on its command line, and never for one that only names secrets with `--env` — Validates: FR-007

## Architecture overview

```text
.mcp.yaml ──► mcp.sh --env A -- <server argv>       stackra mcp exec --env A -- <server argv>
                 │ refuses $NAME in argv                  │ mcpExecCommand refuses $NAME in argv
                 ▼                                         ▼
          secrets-exec.mjs --names A               sops exec-env agents/A.enc.yaml 'exec <quoted argv>'
                 │ sops decrypt in memory                  │ sops puts A in the child's environment
                 ▼                                         ▼
          spawn(server argv, env + {A})            server (reads A from its environment)
```

## Components and responsibilities

- `tools/scripts/mcp.sh`: parses `--env`, refuses references, adds the Linear digest's built-in names, changes to the
  repository root, execs `secrets-exec.mjs --names`.
- `tools/scripts/secrets-exec.mjs`: decrypts the named `agents` secrets into the child's environment; no expansion.
- `tools/scripts/mcp-github.headers`: the GitHub MCP header with a placeholder.
- `flow.config.json` (`mcp`) → `.mcp.yaml` (rendered by `fflow sync`): the four token servers with `--env`.
- `mcpExecCommand` (`packages/developer/mcp/src/core/functions/mcp-exec-command.function.ts`): validates and builds the
  nested `sops exec-env` command.
- `execWithSecrets` (`packages/developer/mcp/src/node/functions/exec-with-secrets.function.ts`): passes `secrets`.
- `ruleIssues` (`packages/developer/mcp/src/core/functions/rule-issues.function.ts`): `secret_on_argv`.
- `MCP_EXEC_COMMAND` (`packages/developer/cli/src/node/constants/mcp-exec-command.constant.ts`): `--env`.

## Files and folders

```text
tools/scripts/
├── mcp.sh
├── mcp-github.headers
├── secrets-exec.mjs
├── README.md
└── __tests__/{mcp-sh,secrets-exec}.test.mjs
packages/developer/mcp/src/
├── core/constants/secret-reference.constant.ts
├── core/functions/{mcp-exec-command,rule-issues}.function.ts (+ __tests__, parse-mcp-config test fixture)
├── core/types/{mcp-exec-options,mcp-issue}.type.ts
└── node/functions/exec-with-secrets.function.ts (+ __tests__)
packages/developer/cli/src/node/constants/mcp-exec-command.constant.ts (+ __tests__)
```

- `tools/scripts/mcp.sh`, `tools/scripts/mcp-github.headers`, `tools/scripts/secrets-exec.mjs`
- `tools/scripts/__tests__/mcp-sh.test.mjs`, `tools/scripts/__tests__/secrets-exec.test.mjs`
- `flow.config.json`, `.mcp.yaml`, `.flow/lock.json`
- `packages/developer/mcp/src/core/functions/mcp-exec-command.function.ts`
- `packages/developer/mcp/src/core/functions/rule-issues.function.ts`
- `packages/developer/mcp/src/core/types/mcp-exec-options.type.ts`, `packages/developer/mcp/src/core/types/mcp-issue.type.ts`
- `packages/developer/mcp/src/core/constants/secret-reference.constant.ts`
- `packages/developer/mcp/src/node/functions/exec-with-secrets.function.ts`
- `packages/developer/cli/src/node/constants/mcp-exec-command.constant.ts`
- the tests beside each, `.changeset/mcp-secrets-off-argv.md` and the docs the spec lists

## Data models and migrations

none

## Contracts

- `stackra mcp exec [--env NAME[,NAME…]] -- <command> [args…]` (new option; a `$NAME` in the command is now refused).
- `McpExecOptions.secrets?: readonly string[]` (new).
- `mcpExecCommand(argv, options?)`: signature unchanged; throws on a reference or a bad name.
- `ruleIssues`: new code `secret_on_argv`; `secret_without_exec` now covers `env` only.
- `tools/scripts/mcp.sh [--env NAME[,NAME…]] [--] <command> [args…]`; `secrets-exec.mjs --names A,B -- <command>`.

## Error handling

Refusals are value-free: they name the secret (a name is not a value) or say only that a name is malformed. `mcp.sh`
exits 2 on usage and references; `secrets-exec.mjs` keeps its exit 1 refusal; `mcpExecCommand` throws an `Error` the
CLI prints.

## Security and tenancy

The fix moves every token from argv (readable by any user) to the server's environment (readable by the same user;
the STA-303 guard denies agent listings of it). No value is written to a file, log or output; the header file holds a
placeholder. Pinned server versions keep the environment handling that was read.

## Testing strategy

- AC-001, AC-002: `mcp-sh.test.mjs` launches every `.mcp.yaml` `mcp.sh` server with canaries and checks argv and
  environment, the header placeholder, and the refusals; fails on `main` ("context7: CONTEXT7_API_KEY on argv").
- AC-003: `exec-with-secrets.function.test.ts` runs a real child under a fake `sops exec-env`; `mcp-exec-command`
  tests check the built command.
- AC-004: `rule-issues.function.test.ts`; `parse-mcp-config.function.test.ts` keeps the template shapes valid.
- AC-005: `secrets-exec.test.mjs`.
- Each new test fails with the source reverted to `main`.

## Rollout

Minor changesets for `@stackra/mcp` and `@stackra/cli`, a patch for `@stackra/flow-preset`. This repository adopts it
on merge (`.mcp.json` re-renders on `pnpm install`). The template migrates its `context7` line when it takes the
release.

## Delegation and risk plan

One session, one branch. Budget: small (one PR). Follow-up: the template's `.mcp.yaml` after the release.

## ADRs

ADR 0525 (sops `agents` scope; "into the MCP server's process only"), ADR 0267 (the model never sees a secret), ADR
0282 decision 3 (`stackra mcp exec`), ADR 0173 (names in git, values never): all Accepted.

## Docs

`packages/developer/mcp/README.md`, `packages/developer/cli/README.md`, `packages/developer/cli/AGENTS.md`,
`apps/docs/src/docs/runbooks/secrets.mdx`, `apps/docs/src/docs/runbooks/token-rotation.mdx`,
`.flow/overrides/rules/secrets.md`, `packages/developer/flow-preset/preset/rules/secrets.md`, `tools/scripts/README.md`,
`.changeset/mcp-secrets-off-argv.md`.

## Complexity tracking

none
