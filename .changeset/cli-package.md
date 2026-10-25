---
"@stackra/cli": minor
---

Add `@stackra/cli`, the `stackra` binary, thin first. `stackra gen [--check]` runs gen-core on a member or on every
`stackra.config.ts` member at the workspace root and prints each refusal with its fix. `stackra dev|build|start|
typecheck|test|lint` run gen, then the member's tool with the config gen wrote into `.stackra/`: Vite, Expo, tsdown,
Wrangler, the generated Encore app, Mintlify, vitest, Playwright, Maestro, tsc and oxlint, chosen by layout and target;
at the workspace root they run `turbo run <task>`. `stackra ls [section]` lists the identities a committed manifest
locks. `stackra mcp`, `stackra mcp sync`, `stackra mcp exec --`, `stackra agents sync` and `stackra agents check`
wire `@stackra/mcp`. The old `console` command framework is folded in as a small `node:util` `parseArgs` core.
