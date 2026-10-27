---
"@stackra/cli": minor
---

Add `stackra add <kind> <name>[@version]` (ADR 0453, STA-1336): resolves the item in the Stackra registry catalogue
(`@stackra`, then `@stackra-pro`), checks its tarball's integrity, installs a skill, agent, MCP server or plugin into
its target (a package through `pnpm add`) and pins it in `stackra-items.lock.yaml`. Add `stackra publish`, which
checks `stackra.kind` and the `@<scope>/<kind>-<name>` name before `pnpm publish` to the registry. The registry origin
is a setting (`--registry`, `STACKRA_REGISTRY`, the workspace `.npmrc`, default `https://npm.stackra.figentra.com/`).
New dependency: `@stackra/skills`.
