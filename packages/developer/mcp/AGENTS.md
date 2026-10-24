# AGENTS — @stackra/mcp

The local developer MCP (ADR 0282). Member at `packages/developer/mcp` (`tier:lib`), in the programming model v3.1
shape (ADR 0294, 0305). Entries `.` and `./node` (ADR 0127, 2026-10-24 note).

## Where code goes

| You are writing…                                  | It goes in…                                 |
| ------------------------------------------------- | ------------------------------------------- |
| `.mcp.yaml` parsing, rendering, command building  | `src/core/functions/<name>.function.ts`     |
| Anything that reads files, spawns or speaks stdio | `src/node/functions/`                       |
| Errors, constants, types                          | `src/<entry>/{errors,constants,types}/`     |
| A test                                            | `__tests__/<name>.<kind>.test.ts` beside it |

## This package

- `.` stays bundle-safe: no `node:*` import outside `src/node/`.
- A secret value never passes through this process: `execWithSecrets` hands `$NAME` references to
  `infisical run ... -- sh -c` and never reads, prints or puts a value on argv. Never add a flag that takes a value.
- Every write tool of the local server goes through the CLI's `run`, so the CLI's gates apply.
- `.mcp.yaml` rules carry snake_case codes (`secret_without_exec`, `secret_in_remote_server`, `unpinned_npx_server`).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.

## PII

None. The package handles MCP server definitions and secret names only; it never sees a secret value.
