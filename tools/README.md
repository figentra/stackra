# `tools/`

Repository tooling that is not a workspace member: it has no `package.json`, no tier and is never published.

| Path                    | Holds                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| [`scripts/`](scripts)   | the Node scripts behind the root `pnpm` commands, with their tests in `__tests__/`                |
| [`scaffold/`](scaffold) | the member templates `pnpm new <kind> <name>` renders                                             |
| [`schemas/`](schemas)   | JSON Schemas (draft 2020-12) for Stackra's own config files: runway, lock, MCP                    |
| [`policy/`](policy)     | policies the verify service enforces: `licences.json`, the licence policy (CTO ruling 2026-11-24) |

## Licence policy

`policy/licences.json` is the CTO's ruling of 2026-11-24, enforced by `stackra/verify`'s licence-policy step over
every installed package and every workspace manifest:

- `allow` lists SPDX ids; an id a `deny` pattern matches (GPL, LGPL, AGPL, SSPL, BUSL, Elastic, CC NC/ND, Unknown)
  never counts as allowed, so it passes only as an OR alternative beside an allowed licence, or through an exception.
- An exception names one package, its exact licence string, a reason, a `scope` and, when pinned, its `versions`; a
  change of name, string or pinned version fails the step again, and a malformed exception is itself a failure.
- `dev-only`: the package is never in a publishable member's (no `"private": true`) `dependencies`,
  `optionalDependencies` or non-optional `peerDependencies`. `optionalDependencies` count as shipped, because
  consumers install them by default, so a dev-only package there fails the check; devDependencies and peers marked
  optional in `peerDependenciesMeta` pass.
- `mobile`: the package is a dependency of `apps/mobile` and `apps/playground` only (the two members
  `stackra/verify-mobile` covers), never of another member and never through an override.

## Rules

- Scripts are plain Node 24 `.mjs` (ESM), mostly dependency-free so they run before `pnpm install`; relative imports
  keep their `.mjs` extension ([ADR 0006](../apps/docs/src/docs/adr/0006-naming-exports-and-imports.mdx)).
- Each script opens with a docblock that states its purpose, inputs and secrets handling.
- A script that needs a token reads it from the environment, injected by `tools/scripts/secrets-exec.mjs` (the
  `agents` scope of figentra/secrets, decrypted by sops in memory); it never reads a file or prints a secret.
- Tests sit in `scripts/__tests__/` and run with `node --test` in `pnpm validate`.
- Schemas are the source of truth for runway (root, app, service), `stackra.lock.yaml`, `.mcp.yaml` and
  `.github/branch-protection.json`. Each keeps its `https://static.stackra.figentra.com/schemas/` `$id` for later hosting; until then
  `.vscode/settings.json` maps them by relative path, and stackra-template carries a copy in its `schemas/` folder.
