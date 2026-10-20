# AGENTS — @stackra/brand

Stackra brand tokens, themes and resources. Kind: **lib** (`packages/experience/brand`, `tier:lib`).

## Where code goes

| You are writing…        | It goes in…                                                      |
| ----------------------- | ---------------------------------------------------------------- |
| A function, type, class | `src/<kebab-name>.ts`, re-exported by `src/index.ts`             |
| A test                  | `src/__tests__/`                                                 |
| A brand file (from kit) | `resources/<kind>/` — brand assets fall under `resources/NOTICE` |

One entry (`.`), no layers. A second entry point is a sign this should be a platform package.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only. Relative imports carry no extension and no `/index`.
- At least one test; coverage meets the shared gate (lines/functions 80, branches 70).

## Tasks

`pnpm turbo run <task> --filter=@stackra/brand` — `build`, `typecheck`, `lint`, `test`, `test:coverage`,
`format`, `format:check`, `clean`.

## PII

| Data | Where | Handling                                   |
| ---- | ----- | ------------------------------------------ |
| None | —     | This package handles no personal data yet. |
