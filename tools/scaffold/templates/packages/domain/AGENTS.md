# AGENTS — @stackra/{{NAME}}

{{DESCRIPTION}} Kind: **domain** (`packages/{{CATEGORY}}/{{NAME}}`, `tier:lib`).

## Where code goes

| You are writing…                                 | It goes in…                    |
| ------------------------------------------------ | ------------------------------ |
| An entity, value object, invariant, domain error | `src/core/`                    |
| A use case, command, query, handler              | `src/application/`             |
| The interface a use case needs (a port)          | `src/application/`             |
| A repository, client, provider, adapter          | `src/infrastructure/`          |
| Request/response mapping over a command          | `src/presentation/api/`        |
| A component, hook, screen                        | an opt-in surface (see README) |
| A test                                           | `__tests__/` beside the code   |

## Rules that fail the build

- `core` imports no other layer and no host library (`react`, `react-native`, `encore.dev`).
- `application` imports `#core` only; never `#infrastructure`, `#presentation/*` or a host library.
- `presentation` never imports `#infrastructure` — the host passes adapters in.
- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only. Relative imports carry no extension and no `/index`.
- Every layer ships at least one test; coverage meets the shared gate (lines/functions 80, branches 70).

## Tasks

`pnpm turbo run <task> --filter=@stackra/{{NAME}}` — `build`, `typecheck`, `lint`, `test`, `test:coverage`,
`format`, `format:check`, `clean`.

## PII

| Data | Where | Handling                                   |
| ---- | ----- | ------------------------------------------ |
| None | —     | This package handles no personal data yet. |
