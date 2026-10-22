# `tools/`

Repository tooling that is not a workspace member: it has no `package.json`, no tier and is never published.

| Path                    | Holds                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------- |
| [`scripts/`](scripts)   | the Node scripts behind the root `pnpm` commands, with their tests in `__tests__/` |
| [`scaffold/`](scaffold) | the member templates `pnpm new <kind> <name>` renders                              |
| [`schemas/`](schemas)   | JSON Schemas (draft 2020-12) for Stackra's own config files: runway, lock, MCP     |

## Rules

- Scripts are plain Node 24 `.mjs` (ESM), mostly dependency-free so they run before `pnpm install`; relative imports
  keep their `.mjs` extension ([ADR 0006](../apps/docs/src/adr/0006-naming-exports-and-imports.mdx)).
- Each script opens with a docblock that states its purpose, inputs and secrets handling.
- A script that needs a token reads it from the environment, injected by `infisical run`; it never reads a file or
  prints a secret.
- Tests sit in `scripts/__tests__/` and run with `node --test` in `pnpm validate`.
- Schemas are the source of truth for runway (root, app, service), `stackra.lock.yaml`, `.mcp.yaml` and
  `.github/branch-protection.json`. Each keeps its `https://schemas.stackra.dev/` `$id` for later hosting; until then
  `.vscode/settings.json` maps them by relative path, and stackra-template carries a copy in its `schemas/` folder.
