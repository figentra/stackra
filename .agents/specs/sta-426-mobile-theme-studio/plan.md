# Implementation Plan: The mobile Theme Studio in Settings

**Spec**: `.agents/specs/sta-426-mobile-theme-studio/spec.md` · **Linear**: STA-426 · **Date**: 2026-10-24

## Summary

A theme settings store in `apps/mobile` holds the base theme and its knobs with an undo and redo history, derives the
theme with `deriveTheme`, and pushes `themeVariables(theme).heroui` to Uniwind's light and dark themes at runtime. The
Settings screen draws the knobs, the contrast pairs, and the share and import of the theme as JSON.

## Technical Context

- **Language**: TypeScript (React Native)
- **Members**: `apps/mobile`
- **Testing**: vitest in `src/**/__tests__/` through the shared vitest preset
- **Storage**: none (in memory)
- **Runtime target**: React Native (iOS and Android)

## Constitution Check

| Law                                   | Result | Note                                              |
| ------------------------------------- | ------ | ------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | the app imports `@stackra/tokens`, a lib          |
| Secrets (ADR 0173)                    | N/A    | no secret involved                                |
| Security                              | PASS   | an imported theme is validated before it applies  |
| HTTP and events                       | N/A    | no action or event                                |
| Tenancy                               | N/A    | no tenant data                                    |
| Delegation                            | PASS   | builder session; separate reviewer                |
| Not built yet (ADR 0227)              | PASS   | no new technology                                 |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                             |
| Versions and catalogs                 | PASS   | `catalog:quality` and `workspace:*`, no new entry |
| Deploy modes (ADR 0076)               | PASS   | client only                                       |
| Licence tier (ADR 0077)               | PASS   | the private app                                   |
| Docs and ADRs                         | N/A    | applies ADR 0320's studio; no doc changes         |

## Deploy modes

| Mode       | Behaviour                                 |
| ---------- | ----------------------------------------- |
| SaaS       | the mobile app's Settings tab tunes theme |
| On-prem    | the mobile app's Settings tab tunes theme |
| Air-gapped | the mobile app's Settings tab tunes theme |

## Correctness properties

- **P-001**: Every knob change derives a theme and pushes its HeroUI variables to both Uniwind themes — Validates: FR-001
- **P-002**: Undo, redo and reset walk the history, and an invalid import keeps the last good theme — Validates: FR-002

## Contracts and events

None.

## Data and tenancy

None.

## Delegation and risk plan

R1: one builder, separate code review. One wave.

## ADRs

None new (ADR 0320).

## Docs

None.

## Project structure

`apps/mobile/src/{screens/settings-screen.tsx,stores/theme-settings.store.ts,stores/__tests__/theme-settings.store.test.ts}`.
