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
  `sops exec-env <file> 'exec …'` (one per secret, ADR 0525) and never reads, prints or puts a value on argv. Never add a flag that takes a value.
- Every write tool of the local server goes through the CLI's `run`, so the CLI's gates apply.
- A local tool is a console command declared `tool` in `src/node/commands/`, listed in `DEV_TOOL_COMMANDS` and
  served through `toolsOf`: never a hand-written tool table. A tool describes only kinds, sections and phases that
  exist; an enum mirrors the CLI (`NEW_KINDS`, `CHECK_PHASE_NAMES`) and `@stackra/cli`'s `MCP_COMMAND` test holds it
  there. A tool that writes is refused on a deployed target (`deployedTarget`), and an unset `STACKRA_ENVIRONMENT`
  is one: fail closed; only `stackra mcp` and `stackra dev` declare `dev`.
- A tool reports findings only as `Diagnostic`s (`@stackra/console/contracts`), never a shape of its own: a runner tool
  returns them as `diagnostics` from its `read`, `runToolCommand` writes the log and `toolResult` lifts them to the top
  of the result. A `code` is what `stackra explain` takes; a `docsUrl` comes from the tool's output or `explainDocs`,
  never typed by hand.
- The hosted server core (`toolTable`, `filterTools`, `protectedResourceMetadata`, `wwwAuthenticate`) is pure and
  lives in `.`. It reads committed manifests only, never adds or annotates a tool by hand, and takes every URL,
  permission and entitlement answer from the host; the deployment itself is the OS `ai` service.
- `.mcp.yaml` rules carry snake_case codes (`secret_without_exec`, `secret_in_remote_server`, `unpinned_npx_server`).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.

## PII

None. The package handles MCP server definitions and secret names only; it never sees a secret value.
