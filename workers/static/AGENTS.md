# AGENTS — @figentra/worker-static

Stackra's hosted static files: a Cloudflare static-assets Worker (`stackra-static`) at `static.stackra.figentra.com`
(ADR 0284). Member at `workers/static` (`tier:app`, the tier `workers/*` reuses). Build code lives in `src/`; the
entry is `src/main.ts`, which writes the assets to `dist/site`. Read `README.md` for the URL layout and deploy flow.

## Rules that fail the build

- Versions are `catalog:<name>` or `workspace:*` only; `wrangler` comes from `catalog:deploy`.
- `tsconfig.json` extends one `@stackra/typescript-config` preset and nothing else.
- Every schema `$id` is `https://static.stackra.figentra.com/schemas/<name>.json`, and `<name>` may not start with
  `latest`, `v<n>`, an `x.y.z` version or `index.json` (`parseSchema` throws).
- A `schemas@*` tag is exactly `schemas@x.y.z` (`readSchemaReleases` throws on anything else).

## Rules agents follow

- Never run `wrangler deploy`, `wrangler secret …` or anything that changes the Cloudflare account. CI deploys from
  `main` and `schemas@*` tags only.
- Never move or delete a `schemas@*` tag: the exact-version paths are immutable because their tags are.
- Set `Cache-Control` only in `src/site/render-headers.ts`, on the `/` rule and the exact-version rules. Cloudflare
  joins the values of every matching `_headers` rule, so a Cache-Control on `/*` produces a broken header.
- The HTML page (`src/site/render-page.ts`) stays self-contained: no script, no external request, no schema listing.
- A new kind of hosted file gets its own first path segment (like `/schemas/`), not a new member or Worker.
- `wrangler.jsonc` is hand-written under ADR 0284's carve-out until `stackra gen` emits Workers config (ADR 0168).
- Keep the `observability` block in `wrangler.jsonc` (Workers Logs, STA-1573): change the sampling there, and the
  uptime probe in the root `runway.yaml` `observability.uptime`, never in code.

## Tasks

`pnpm turbo run <task> --filter=@figentra/worker-static` — `build`, `test`, `typecheck`, `lint`, `format`,
`format:check`, `clean`. `dev` runs `wrangler dev` on the built `dist/site`. `build` is never cached (it reads git
tags).

## PII

| Data | Where | Handling                                                               |
| ---- | ----- | ---------------------------------------------------------------------- |
| None | —     | Serves public JSON Schemas only; stores and receives no personal data. |
