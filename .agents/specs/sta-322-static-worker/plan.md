# Implementation Plan: Hosted static files Worker at static.stackra.figentra.com

**Spec**: `.agents/specs/sta-322-static-worker/spec.md` · **Linear**: STA-322 · **Date**: 2026-10-22

## Summary

A new member `workers/static` builds an assets-only Cloudflare Worker: a small Node builder (bundled by tsdown) reads
`tools/schemas` at the working tree and at every `schemas@*` tag, plans the URL layout, writes `dist/site` with a
generated `_headers`, and CI runs `wrangler deploy` with a token from Infisical over OIDC.

## Technical Context

- **Language**: TypeScript on Node 24 (bundled by tsdown, run by `pnpm build`)
- **Members**: `workers/static` (new), root tooling, `apps/docs`
- **Testing**: vitest in `workers/static/src/site/__tests__/`; node:test in `tools/scripts/__tests__/`
- **Storage**: none; git tags are the release store
- **Runtime target**: Cloudflare Workers static assets (no Worker script)

## Constitution Check

| Law                                   | Result | Note                                                       |
| ------------------------------------- | ------ | ---------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `workers/*` is `tier:app`; imports no workspace package    |
| Secrets (ADR 0173)                    | PASS   | token from Infisical `/ci` over OIDC; no repository secret |
| Security                              | PASS   | public files only; separate review                         |
| HTTP and events                       | N/A    | static files, no action or event                           |
| Tenancy                               | N/A    | no tenant data                                             |
| Delegation                            | PASS   | builder agent; separate reviewer                           |
| Not built yet (ADR 0227)              | PASS   | no rejected technology; not a gateway                      |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                                      |
| Versions and catalogs                 | PASS   | `wrangler` exact pin in `catalog:deploy`                   |
| Deploy modes (ADR 0076)               | PASS   | SaaS edge only                                             |
| Licence tier (ADR 0077)               | N/A    | UNLICENSED member, not distributed                         |
| Docs and ADRs                         | PASS   | ADR 0284, READMEs, workspace-layout rule                   |

## Deploy modes

| Mode       | Behaviour                                         |
| ---------- | ------------------------------------------------- |
| SaaS       | `stackra-static` Worker on Cloudflare, CI deploys |
| On-prem    | not deployed; the schemas are public URLs         |
| Air-gapped | not deployed; editors fall back to local schemas  |

## Correctness properties

- **P-001**: Every schema and release lands at exactly the planned paths, each copy naming its own URL — Validates: FR-001
- **P-002**: `_headers` carries CORS on `/*` and Cache-Control only on exact-version trees, within the rule cap — Validates: FR-002
- **P-003**: An invalid `$id` or tag fails the build with the file or tag named — Validates: FR-003
- **P-004**: Releases are read from tags as they were at the tag; other tags are ignored — Validates: FR-004
- **P-005**: The deploy job runs only from main or a tag on main and skips without the identity — Validates: FR-005

## Contracts and events

Public URLs under `https://static.stackra.figentra.com/schemas/` and `/schemas/index.json` (`host`, `schemas[{id,
title}]`, `releases`).

## Data and tenancy

None.

## Delegation and risk plan

R2: one builder, separate code and security review, no delegation. One wave.

## ADRs

ADR 0284 (Accepted).

## Docs

ADR 0284, `workers/README.md`, `workers/static/README.md`, `workers/static/AGENTS.md`, `.agents/rules/workspace-layout.md`,
`.github/workflows/README.md`.

## Project structure

`workers/static/{wrangler.jsonc,src/main.ts,src/site,src/constants,src/interfaces}`, `.github/workflows/deploy-static.yml`,
`tools/scripts/{validate-repository,doc-standard,agents-sync}.mjs`, `knip.jsonc`, `pnpm-workspace.yaml`.
