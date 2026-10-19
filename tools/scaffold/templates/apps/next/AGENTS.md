# AGENTS — @figentra/{{NAME}}

- Routes live in `src/app/` (App Router); components start as Server Components — add `"use client"` only where
  state or effects need it. The `@/` alias points at `src/`. Tests go in `__tests__/` beside the code.
- UI comes from `@heroui/react`; styles are Tailwind v4 utilities.
- Talk to the backend only through the generated API client, never by importing `services/`.
- A new `@stackra/*` dependency is picked up by `transpilePackages` automatically; do not list it by hand.
- Only `NEXT_PUBLIC_*` variables reach the browser; anything there is public. Server secrets are not read here yet.
- Versions only via `catalog:<name>` or `workspace:*`. `tsconfig.json` only extends `@stackra/typescript-config/next`.
- Tasks: `dev`, `build`, `start`, `typecheck`, `test`, `lint`, `format`, `format:check`, `clean`.

## PII

| Data  | Where | Handling |
| ----- | ----- | -------- |
| None. | —     | —        |
