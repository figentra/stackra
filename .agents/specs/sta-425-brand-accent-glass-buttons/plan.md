# Implementation Plan: A steel-blue brand accent and glass buttons on the web

**Spec**: `.agents/specs/sta-425-brand-accent-glass-buttons/spec.md` · **Linear**: STA-425 · **Date**: 2026-10-24

## Summary

`STACKRA_THEME` gets an `ACCENT` token on hue 248 and steel-blue hover, pressed and soft steps; `focus` takes the
accent. `renderWebCss` adds glass rules for HeroUI's quiet button variants and the default close button to its one
components layer, and their edge to the forced-colours fallback. ADR 0319 records both.

## Technical Context

- **Language**: TypeScript (isomorphic)
- **Members**: `packages/design-system/tokens`, `apps/docs`
- **Testing**: vitest in `src/**/__tests__/`; the playground's e2e suite for the pages
- **Storage**: none
- **Runtime target**: the browser (web CSS) and React Native (native CSS)

## Constitution Check

| Law                                   | Result | Note                                  |
| ------------------------------------- | ------ | ------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | tokens imports nothing new            |
| Secrets (ADR 0173)                    | N/A    | no secret involved                    |
| Security                              | N/A    | values and CSS only                   |
| HTTP and events                       | N/A    | no action or event                    |
| Tenancy                               | N/A    | no tenant data                        |
| Delegation                            | PASS   | builder session; separate reviewer    |
| Not built yet (ADR 0227)              | PASS   | no new technology                     |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                 |
| Versions and catalogs                 | N/A    | no dependency change                  |
| Deploy modes (ADR 0076)               | PASS   | the stylesheets every mode loads      |
| Licence tier (ADR 0077)               | PASS   | MIT package                           |
| Docs and ADRs                         | PASS   | ADR 0319, tokens README, brand record |

## Deploy modes

| Mode       | Behaviour                          |
| ---------- | ---------------------------------- |
| SaaS       | the theme stylesheets as published |
| On-prem    | the theme stylesheets as published |
| Air-gapped | the theme stylesheets as published |

## Correctness properties

- **P-001**: The accent family is on hue 248 with a chroma of 0.03 or more, its label at 4.5:1 and focus at 3:1 — Validates: FR-001
- **P-002**: The quiet variants set HeroUI's button properties to the regular glass and set no box-shadow — Validates: FR-002

## Contracts and events

None.

## Data and tenancy

None.

## Delegation and risk plan

R1: one builder, separate code review. One wave.

## ADRs

ADR 0319 (new).

## Docs

`packages/design-system/tokens/README.md`.

## Project structure

`packages/design-system/tokens/{src/core/constants/stackra-theme.constant.ts,src/core/functions/render-web-css.function.ts,assets/public/themes/stackra/*.css,assets/data/stackra/brand.json}`.
