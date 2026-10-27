# Implementation Plan: Brand kit adoption

**Spec**: `.agents/specs/sta-173-brand-kit-adoption/spec.md` · **Linear**: STA-173 · **Date**: 2026-10-20

## Summary

Vendor the approved brand kit into `packages/experience/brand/assets/`, keep the TS token exports, point the mobile
app, the docs site and the app scaffold templates at the package, and keep the brand assets under their NOTICE.

## Technical Context

- **Language**: TypeScript (package tests), CSS (Tailwind v4 / Uniwind), JSON (Expo, Mintlify), YAML (electron-builder)
- **Members**: `packages/experience/brand`, `apps/mobile`, `apps/docs`; templates in `tools/scaffold/templates/apps`
- **Testing**: vitest in `packages/experience/brand/src/__tests__/`; node:test in `tools/scripts/__tests__/scaffold.test.mjs`
- **Storage**: none
- **Runtime target**: static files bundled by Vite, Metro/Expo, electron-builder and Mintlify

## Constitution Check

| Law                                   | Result | Note                                                 |
| ------------------------------------- | ------ | ---------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | apps depend on a lib; the lib imports nothing        |
| Secrets (ADR 0009)                    | PASS   | none read or added                                   |
| Security                              | PASS   | static files only                                    |
| HTTP and events                       | N/A    | no endpoint or event                                 |
| Tenancy                               | N/A    | no tenant data                                       |
| Delegation                            | PASS   | builder agent; review by a separate reviewer         |
| Not built yet (ADR 0011)              | PASS   | no rejected technology                               |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                                |
| Versions and catalogs                 | PASS   | `workspace:*` only                                   |
| Deploy modes (ADR 0076)               | PASS   | identical in every mode                              |
| Licence tier (ADR 0077)               | PASS   | code MIT; brand assets excluded by NOTICE (ADR 0024) |
| Docs and ADRs                         | PASS   | ADR 0024 path updated; package README                |

## Deploy modes

| Mode       | Behaviour                                                                               |
| ---------- | --------------------------------------------------------------------------------------- |
| SaaS       | brand files bundled into each app                                                       |
| On-prem    | brand files bundled into each app                                                       |
| Air-gapped | brand files bundled; no CDN fonts in the apps (docs site loads Geist from Google Fonts) |

## Correctness properties

- **P-001**: The TS colour tokens equal the kit's resolved tokens and each is a custom property in the web theme — Validates: FR-001
- **P-002**: Every `@font-face` file and both OFL texts exist, and `assets/NOTICE` excludes the brand assets from MIT — Validates: FR-001, FR-002
- **P-003**: Every `@stackra/brand/assets/…` path a rendered app template references exists in the package — Validates: FR-003

## Contracts and events

`@stackra/brand` exports `./assets/*` (static files); TS exports unchanged.

## Data and tenancy

None.

## Delegation and risk plan

R2: one builder, separate reviewer, no delegation. One wave.

## ADRs

ADR 0024 (decision 2) already covers the exclusion; only the NOTICE path changes.

## Docs

`packages/experience/brand/README.md`, `apps/docs/src/docs/adr/0024-mit-license-with-exclusions.mdx`.

## Project structure

`packages/experience/brand/{assets,src}`, `apps/mobile/{app.json,src/global.css,package.json}`,
`apps/docs/src/{docs.json,assets}`, `tools/scaffold/templates/apps/{console,mobile,desktop,docs}`, root `README.md`,
`NOTICE`, `.oxfmtrc.jsonc`, `knip.jsonc`, `tools/scripts/validate-repository.mjs`.
