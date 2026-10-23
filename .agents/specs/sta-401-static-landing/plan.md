# Implementation Plan: Branded landing and 404 page for the static host

**Spec**: `.agents/specs/sta-401-static-landing/spec.md` · **Linear**: STA-401 · **Date**: 2026-10-23

## Summary

`renderPage` returns one HTML document with the inlined wordmark and stackra theme values; `planSite` writes it as
`/index.html` and `/404.html`; `renderHeaders` adds a `/` rule with a five-minute Cache-Control; `wrangler.jsonc` sets
`not_found_handling: "404-page"`.

## Technical Context

- **Language**: TypeScript on Node 24 (the existing builder)
- **Members**: `workers/static`
- **Testing**: vitest in `workers/static/src/site/__tests__/`
- **Storage**: none
- **Runtime target**: Cloudflare Workers static assets (no Worker script)

## Constitution Check

| Law                                   | Result | Note                                                           |
| ------------------------------------- | ------ | -------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | the wordmark and theme values are copied; no app import        |
| Secrets (ADR 0173)                    | N/A    | no secret involved                                             |
| Security                              | PASS   | no script, meta CSP `default-src 'none'`, no external request  |
| HTTP and events                       | N/A    | static files, no action or event                               |
| Tenancy                               | N/A    | no tenant data                                                 |
| Delegation                            | PASS   | builder agent; separate reviewer                               |
| Not built yet (ADR 0227)              | PASS   | no new technology                                              |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                                          |
| Versions and catalogs                 | N/A    | no dependency change                                           |
| Deploy modes (ADR 0076)               | PASS   | SaaS edge only                                                 |
| Licence tier (ADR 0077)               | N/A    | UNLICENSED member, not distributed                             |
| Docs and ADRs                         | PASS   | member README and AGENTS; ADR 0284 decision 5 is only extended |

## Deploy modes

| Mode       | Behaviour                                       |
| ---------- | ----------------------------------------------- |
| SaaS       | served by the `stackra-static` Worker           |
| On-prem    | not deployed; the host is a public SaaS address |
| Air-gapped | not deployed                                    |

## Correctness properties

- **P-001**: The page is written as both HTML files, carries the wordmark, docs link and footer, and names no schema, script or external resource — Validates: FR-001
- **P-002**: `wrangler.jsonc` uses `404-page`, and `_headers` sets Cache-Control on `/` and exact-version trees only — Validates: FR-002

## Contracts and events

`/` and every unknown path return the HTML page; JSON URLs unchanged.

## Data and tenancy

None.

## Delegation and risk plan

R1: one builder, separate code review. One wave.

## ADRs

None new; ADR 0284 stands.

## Docs

`workers/static/README.md`, `workers/static/AGENTS.md`.

## Project structure

`workers/static/{wrangler.jsonc,src/site/render-page.ts,src/site/plan-site.ts,src/site/render-headers.ts,src/constants}`.
