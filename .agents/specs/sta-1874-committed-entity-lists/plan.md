# Plan: committed package entity lists (STA-1874)

1. ADR amendments first (docs-adr-steward writes the dated notes; architecture-guardian reviews the placement): 0294 R10
   and 0295's ordering consequence.
2. `@stackra/gen`: in `generateMember`, a package's entity file goes to `src/node/entities.gen.ts`; `generate.function.ts`
   treats it as committed (`gen --check` on a fresh clone requires it); tests and goldens follow.
3. `@stackra/cli`: `packageEntitiesFindings` expects `export { <KEY>_ENTITIES } from "#node/entities.gen"`.
4. The eleven barrels re-export from `#node/entities.gen`; their export tests stay as they are (the name is unchanged).
5. On testbed box 1: install, build the CLI, run `stackra gen`, and bring back the eleven `src/node/entities.gen.ts`
   files (never written by hand); check they pass oxfmt, or teach oxfmt's ignore list the generated name.
6. Changesets: gen and cli (minor), the eleven packages (patch: `./node` now ships the list).
7. Commit with hooks on; compiler-engineer reviews the gen change; CI proves `gen:workspace` and typecheck.
