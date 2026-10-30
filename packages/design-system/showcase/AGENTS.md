<!-- Stackra file contract. Purpose: agent rules for @stackra/showcase. Boundary: packages/design-system/showcase only. Runtime: documentation. Governing contract: ADR 0294, ADR 0302; showcase redesign spec (2026-10-27). -->

# AGENTS — @stackra/showcase

The one component registry of the Stackra showcases (web playground and mobile app): categories, entries, docs links,
the `showcase` catalogues, the generated API docs and the search index. Member at `packages/design-system/showcase`
(`tier:lib`). Data and pure functions only; no React. The README has the structure and how to add a component.

## Where code goes

| You are writing…                                | It goes in…                                                       |
| ----------------------------------------------- | ----------------------------------------------------------------- |
| One registry entry                              | `src/registry/components/<tier>/<slug>.ts`                        |
| An enum, a type or a zod schema of the registry | `src/enums/`, `src/types/`, `src/schemas/` (one declaration each) |
| A registry function                             | `src/registry/<name>.function.ts`                                 |
| Titles, descriptions, keywords and UI words     | `assets/lang/{en,ar}/showcase.json` (both, always)                |
| Prop descriptions in Arabic                     | `assets/lang/ar/api.json` (en is generated)                       |
| A generator step                                | `scripts/` (run by plain Node, so imports name `./x.ts`)          |
| A test                                          | `__tests__/<name>.test.ts` beside its subject                     |

## Generated output

`pnpm -F @stackra/showcase gen` writes `api/`, `search/index.json`, `assets/lang/en/api.json` and the mobile demo
`.code.ts` files from the registry, the props files of `@stackra/ui` and `vendor/heroui*`; `gen:check` fails on drift.
Never edit them by hand: change the source and run gen. `vendor/` is HeroUI's docs data, copied byte for byte.

## Rules

- Keys and paths are derived, never stored. Component titles, prop names, types, defaults and code stay Latin in
  Arabic.
- Every `en` key has an `ar` key with the same ICU placeholders (`pnpm validate`, the catalogue check).
- `pnpm -F @stackra/showcase test` runs the registry gate.

## Commands

`pnpm turbo run <task> --filter=@stackra/showcase` — `build`, `typecheck`, `lint`, `test`; `gen`, `gen:check`.

## PII

| Data | Where | Handling                                                                  |
| ---- | ----- | ------------------------------------------------------------------------- |
| None | —     | Registry data and docs only; the sample names in examples are not people. |
