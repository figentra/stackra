# AGENTS — @stackra/console

Stackra console. Member at `apps/console` (`tier:app`). Everything it runs lives in `src/`; the entry is `src/main.ts`.

## Rules that fail the build

- Versions are `catalog:<name>` or `workspace:*` only.
- `tsconfig.json` extends one `@stackra/typescript-config` preset and nothing else.

## Tasks

`pnpm turbo run <task> --filter=@stackra/console` — `build`, `typecheck`, `lint`, `format`, `format:check`, `clean`.

## PII

| Data | Where | Handling                                                                    |
| ---- | ----- | --------------------------------------------------------------------------- |
| None | —     | Handles no personal data yet. Revisit when it stores or receives user data. |
