# AGENTS — @stackra/{{NAME}}

- Everything lives in `src/`; the `@/` alias points there. Tests sit beside the code in `__tests__/`.
- UI comes from `@heroui/react`; styles are Tailwind v4 utilities. No other component library.
- Talk to the backend only through the generated API client, never by importing `services/`.
- Versions only via `catalog:<name>` or `workspace:*`. `tsconfig.json` only extends `@stackra/typescript-config/vite`.
- Tasks: `dev`, `build`, `preview`, `typecheck`, `test`, `lint`, `format`, `format:check`, `clean`.
- Done = `pnpm verify` green. Secrets: none in this app; anything shipped to the browser is public.

## PII

| Data  | Where | Handling |
| ----- | ----- | -------- |
| None. | —     | —        |
