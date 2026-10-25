# @stackra/cli

The `stackra` binary (ADR 0083, ADR 0282 decision 3). It runs gen, runs each member's tools against the configs gen
writes, lists what a committed manifest locks, and wires the local developer MCP. It folds the old `console` CLI
framework (ADR 0127, 2026-10-24 note): a command is data plus one `run` function, parsed with `node:util`.

**Tier:** `tier:lib` (`packages/developer/cli`). No code entry: the package ships the `bin` only. Depends on
`@stackra/gen`, `@stackra/mcp`, `@stackra/contracts` and `yaml`.

## Commands

| Command                                | Does                                                                                     |
| -------------------------------------- | ---------------------------------------------------------------------------------------- |
| `stackra gen [--check] [--backend]`    | gen-core on the member, or on every `stackra.config.ts` member at the workspace root     |
| `stackra dev [--target <t>]`           | gen, then serve: Vite (web, PWA), Expo (iOS, Android), Wrangler, Encore, Mintlify        |
| `stackra build [--target <t>]`         | gen, then build: tsdown (package), Vite (web), `expo export` (native), Wrangler dry run  |
| `stackra start`                        | gen, then `vite preview` of an app's web build                                           |
| `stackra typecheck`                    | gen, then `tsc --noEmit`                                                                 |
| `stackra test [--tier unit\|e2e]`      | gen, then vitest (unit), Playwright (web and desktop e2e) or Maestro (native e2e)        |
| `stackra lint`                         | `oxlint .`                                                                               |
| `stackra ls [section]`                 | the identities a committed `stackra.manifest.json` locks (actions, events, permissions…) |
| `stackra mcp`                          | the local developer MCP over stdio; its tools run these commands in-process              |
| `stackra mcp sync`                     | render `.mcp.json` from `.mcp.yaml` (the template's `prepare`)                           |
| `stackra mcp exec [--env] [--path] --` | start an MCP server with its secrets, expanded by its own shell under `infisical run`    |
| `stackra agents sync`                  | write the project's generated agent files (`.mcp.json`)                                  |
| `stackra agents check`                 | fail when `.mcp.json` drifted from `.mcp.yaml`                                           |

At the workspace root (a folder with `pnpm-workspace.yaml`), `dev`, `build`, `start`, `typecheck`, `test` and `lint`
run `turbo run <task>` (`test:e2e` for `--tier e2e`); each member's script calls `stackra <task>` again.

Each tool gets `--config .stackra/<tool>.config.ts` when gen wrote it (ADR 0295 decision 5), and finds its own
member-root config otherwise. A task that no tool serves for the member (a desktop target, a service build before the
Encore target) is refused with the reason, never guessed. Exit codes: 0 success, 1 failure, 2 usage error, 127 a tool
that cannot start.

## Not here yet

`stackra db migrate` and `stackra db rollback` are pending: the command code is here, but `@stackra/database/node`
exports no `migrate` and `rollback` yet, so both fail until a follow-up item for `@stackra/database` lands them with the
`DatabaseRunner` signature (`migrate({ cwd, environment }) -> { applied }`, `rollback(...) -> { reverted }`), where
`environment` selects the database the call connects to so the production rollback guard protects the right one.
`stackra db diff` and `seed` land with `@stackra/database` in the data wave (ADR 0159 note).
`new`, `validate`, `verify`, `structure`, `doctor` and `agents setup` move in from `tools/scripts` and their
owning packages as those are built (ADR 0282 consequences). Figentra-internal operations never ship here (ADR 0282
decision 4).
