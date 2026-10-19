# AGENTS — @stackra/{{NAME}}

{{DESCRIPTION}} Kind: **platform** (`packages/{{CATEGORY}}/{{NAME}}`, `tier:lib`).

## Where code goes

| You are writing…                                 | It goes in…                                       |
| ------------------------------------------------ | ------------------------------------------------- |
| The runtime-neutral capability                   | `src/core/`                                       |
| Types/constants a consumer needs without runtime | `src/contracts/` (opt-in entry)                   |
| Fakes and builders for consumers' tests          | `src/testing/` (opt-in entry)                     |
| React / React Native / Node bindings             | `src/react/`, `src/native/`, `src/node/` (opt-in) |
| A test                                           | `__tests__/` beside the code                      |

There is no `presentation/` folder in a platform package.

## Rules that fail the build

- `core` imports no host library (`react`, `react-native`, `encore.dev`) and no host entry.
- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only. Relative imports carry no extension and no `/index`.
- Every entry ships at least one test; coverage meets the shared gate (lines/functions 80, branches 70).

## Tasks

`pnpm turbo run <task> --filter=@stackra/{{NAME}}` — `build`, `typecheck`, `lint`, `test`, `test:coverage`,
`format`, `format:check`, `clean`.

## PII

| Data | Where | Handling                                   |
| ---- | ----- | ------------------------------------------ |
| None | —     | This package handles no personal data yet. |
