# AGENTS — @figentra/{{NAME}}

- Routes live in `src/app/` (expo-router); shared UI in `src/components/`. The `@/` alias points at `src/`.
- UI comes from `heroui-native`; style with Uniwind `className`. Keep the native tab bar (`NativeTabs`) — do not
  replace it with a JS tab bar; use `Glass` for Liquid Glass surfaces.
- Expo-managed versions live in the `mobile` catalog; bump them with `pnpm doctor` (`expo install --check`).
- Never commit `ios/`, `android/` or `.expo/`.
- Versions only via `catalog:<name>` or `workspace:*`. `tsconfig.json` only extends `@stackra/typescript-config/expo`.
- Tasks: `dev`, `ios`, `android`, `typecheck`, `lint`, `format`, `format:check`, `doctor`, `clean`.
- Secrets: none in the bundle; anything shipped in the app binary is public.

## PII

| Data  | Where | Handling |
| ----- | ----- | -------- |
| None. | —     | —        |
