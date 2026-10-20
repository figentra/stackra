# AGENTS — @figentra/{{NAME}}

- Every page, `docs.json`, snippet and asset lives in `src/`. A new page is listed in `src/docs.json` `navigation`.
- No TypeScript, no tests: `build` (`mint validate`) and `lint` (`mint broken-links`) are the checks.
- Versions only via `catalog:docs`.
- Tasks: `dev`, `build`, `lint`, `format`, `a11y`, `clean`.
- Secrets: none; the site is public.

## PII

| Data  | Where | Handling |
| ----- | ----- | -------- |
| None. | —     | —        |
