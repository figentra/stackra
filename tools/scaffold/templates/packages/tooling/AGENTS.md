# AGENTS — @stackra/{{NAME}}-config

{{DESCRIPTION}} Kind: **tooling** (`packages/tooling/{{NAME}}`, `tier:config`).

## Where code goes

| You are writing…      | It goes in…                                         |
| --------------------- | --------------------------------------------------- |
| A preset              | a `.json`/`.jsonc` file in `src/` + `exports` entry |
| A test of the presets | `src/__tests__/`                                    |

## Rules that fail the build

- `tier:config` depends on no `tier:lib`, `tier:service` or `tier:app` member.
- Every `exports` target exists and parses (`presets.test.ts`).
- Versions are `catalog:<name>` or `workspace:*` only.
- Consumers add no settings of their own; a change happens here, with a changeset.
- Secrets: forbidden.

## Tasks

`pnpm turbo run <task> --filter=@stackra/{{NAME}}-config` — `format`, `format:check`, `lint`, `test`.

## PII

| Data | Where | Handling                                      |
| ---- | ----- | --------------------------------------------- |
| None | —     | Config presets; they handle no personal data. |
