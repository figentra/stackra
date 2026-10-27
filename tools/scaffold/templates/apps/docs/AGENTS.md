# AGENTS — @figentra/{{NAME}}

<!--
Stackra file contract:
Purpose: the agent notes of @figentra/{{NAME}}: the docs layout, its checks and the personal data it holds.
Boundary: this member only; the project rules are in the root AGENTS.md.
Runtime: none
Governing contract: ADR 0002 (2026-10-27 amendment); root AGENTS.md
-->

- Source layout: pages in `src/docs/`, images and logos in `src/assets/`, snippets in `src/snippets/`, the site
  configuration in `src/config/docs.config.ts` (a `DocsConfig` subclass from `@stackra/gen`). Member files
  (`README.md`, `AGENTS.md`, `package.json`, `stackra.config.ts`) stay at the root, never in `src/`.
- Never write `docs.json`, `llms.txt` or `api-reference/`: gen writes them into `.stackra/site/`, which is never
  edited or committed. A new page is listed in a navigation group (or its folder is).
- The checks are gen's refusals plus `build` (`mint validate`) and `lint` (`mint broken-links`, `mint a11y`), all run
  through `stackra`. No tests, no runtime code.
- Versions only via `catalog:` and `workspace:*`.
- Tasks: `dev`, `build`, `lint`, `format`, `clean`.
- Secrets: none; the site is public.

## PII

| Data  | Where | Handling |
| ----- | ----- | -------- |
| None. | —     | —        |
