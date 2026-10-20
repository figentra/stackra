# AGENTS — @stackra/{{NAME}}

{{DESCRIPTION}} Member at `packages/{{CATEGORY}}/{{NAME}}` (`tier:lib`), laid out entries-first (ADR 0126).

## Where code goes

| You are writing…                                      | It goes in…                                                  |
| ----------------------------------------------------- | ------------------------------------------------------------ |
| Runtime-neutral code                                  | `src/core/` (the `.` entry)                                  |
| Types, `as const` objects, tokens other members need  | `src/contracts/` (`./contracts`)                             |
| Node-only adapters, drivers, the module, the Explorer | `src/node/` (`./node`)                                       |
| React / React Native bindings                         | `src/react/`, `src/native/`; shared logic in `src/ui/`       |
| Fakes and builders for consumers' tests               | `src/testing/` (`./testing`)                                 |
| Dev-only devtools (frontend panels, backend inspectors) | `src/devtools/` (`./devtools`)                             |
| A feature module                                      | `src/<entry>/modules/<feature>/`, by kind (see README)       |
| Publishable deploy-time defaults                      | `config/{{NAME}}.config.ts`                                  |
| Translation catalogs, stubs, assets                   | `resources/`                                                 |
| A test                                                | `__tests__/` beside the code                                 |

An entry is declared only when it has real code: a folder, its `package.json` `exports` key and its
`tsdown.config.ts` entry, added together.

## Rules that fail the build

- An entry never imports another entry; `core` imports no host library (`react`, `react-native`, `node:*`).
- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only. Relative imports carry no extension and no `/index`.
- No `enum`, no `#private` fields, no `app()`/`config()`/`logger()` helpers, no `*.stories.*`.
- A package that defines decorators ships an Explorer that registers them through the container's
  `DiscoveryService`.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## Tasks

`pnpm turbo run <task> --filter=@stackra/{{NAME}}` — `build`, `typecheck`, `lint`, `test`, `test:coverage`,
`format`, `format:check`, `clean`.

## PII

| Data | Where | Handling                                   |
| ---- | ----- | ------------------------------------------ |
| None | —     | This package handles no personal data yet. |
