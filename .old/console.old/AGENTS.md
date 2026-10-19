# @stackra/console

Vite + React 19 + HeroUI v3 SPA. Tier tag `tier:app`.

## Where code goes

- All code in `src/`; tests in `src/__tests__/` or beside the file.
- UI uses HeroUI v3 components; do not copy components from the mobile app (components are not shared across web and native).

## Rules that fail the build

- Versions only from `pnpm-workspace.yaml` catalogs or `workspace:*`.
- `tsconfig.json` extends one `@stackra/typescript-config` preset (`vite`) and nothing else.
- `turbo.json` extends `//` with exactly one tier tag.
- Empty test suites fail (`passWithNoTests: false`).

## Tasks

`pnpm dev`, `build`, `typecheck`, `lint`, `format:check`, `test`, `clean`.

## PII

| Data | Where | Notes                                       |
| ---- | ----- | ------------------------------------------- |
| None | —     | The console handles no personal data today. |

Revisit when the console shows user, member or tenant data.
