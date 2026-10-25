# Implementation Plan: Native output for the @stackra/tokens palette

**Spec**: `.agents/specs/sta-455-native-palette/spec.md` · **Linear**: STA-455 · **Date**: 2026-10-25

## Summary

`renderNativeCss` adds one `--color-<name>` line per palette entry to each colour variant, after the shadows. The
committed `native.css` is regenerated, and the renderer test checks the palette and the accent pairs as written.

## Technical Context

- **Language**: TypeScript
- **Members**: `packages/design-system/tokens`
- **Testing**: vitest, `src/core/functions/__tests__/render-native-css.function.test.ts`
- **Storage**: none
- **Runtime target**: isomorphic (the renderer); native clients (the stylesheet)

## Constitution Check

| Law                                   | Result | Note                                |
| ------------------------------------- | ------ | ----------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | inside one lib                      |
| Secrets (ADR 0173)                    | N/A    | no secret involved                  |
| Security                              | N/A    | colours only                        |
| HTTP and events                       | N/A    | no action or event                  |
| Tenancy                               | N/A    | no tenant data                      |
| Delegation                            | PASS   | builder session; separate reviewer  |
| Not built yet (ADR 0227)              | PASS   | no new technology                   |
| Test placement (ADR 0022)             | PASS   | the test sits in `__tests__/`       |
| Versions and catalogs                 | N/A    | no dependency change                |
| Deploy modes (ADR 0076)               | PASS   | client stylesheet only              |
| Licence tier (ADR 0077)               | PASS   | free package                        |
| Docs and ADRs                         | PASS   | the tokens README; ADR 0340 applies |

## Deploy modes

| Mode       | Behaviour                                |
| ---------- | ---------------------------------------- |
| SaaS       | native screens paint the theme's palette |
| On-prem    | native screens paint the theme's palette |
| Air-gapped | native screens paint the theme's palette |

## Correctness properties

- **P-001**: Every palette entry is a `--color-<name>` in both variants, with its own value — Validates: FR-001
- **P-002**: The accent label holds 4.5:1 on each accent step written, and the soft pair too — Validates: FR-002

## Contracts and events

None.

## Data and tenancy

None.

## Delegation and risk plan

R1: one builder, separate code review. One wave.

## ADRs

None new.

## Docs

`packages/design-system/tokens/README.md`.

## Project structure

`packages/design-system/tokens/src/core/functions/render-native-css.function.ts`, its test, and
`packages/design-system/tokens/assets/public/themes/stackra/native.css`.
