# @stackra/mobile

Expo app. Tier tag `tier:app`. Never edit `ios/` by hand or touch `node_modules`.

## Where code goes

- Routes in `src/app` (expo-router); components in `src/components`.
- Native UI uses HeroUI Native + Uniwind; do not import web components.

## Rules that fail the build

- Versions only from `pnpm-workspace.yaml` catalogs or `workspace:*`.
- `tsconfig.json` extends the `expo` preset only.
- `turbo.json` extends `//` with exactly one tier tag.
- `package.json` has `main` and no `type` (Expo).

## Tasks

`pnpm dev`, `ios`, `android`, `typecheck`, `lint`, `format:check`, `doctor`, `clean`.

## PII

| Data | Where | Notes                                   |
| ---- | ----- | --------------------------------------- |
| None | —     | The app handles no personal data today. |

Revisit when the app adds sign-in, profiles, push tokens or analytics.
