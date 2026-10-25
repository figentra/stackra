# Implementation Plan: Glass quiet buttons on native

**Spec**: `.agents/specs/sta-432-native-glass-buttons/spec.md` · **Linear**: STA-432 · **Date**: 2026-10-24

## Summary

`useGlassMaterial()` decides once, for every mounted control, whether native glass is `liquid`, `glass` or `solid`
from Liquid Glass support and the accessibility settings. `useGlassButton(variant)` turns that into HeroUI Native's
`background` layer and the class that clears the variant's fill. Button and CloseButton pass it through; IconButton
follows through Button.

## Technical Context

- **Language**: TypeScript (React Native)
- **Members**: `packages/design-system/ui`
- **Testing**: vitest in `src/**/__tests__/` with stand-ins for the native libraries
- **Storage**: none
- **Runtime target**: React Native (iOS and Android)

## Constitution Check

| Law                                   | Result | Note                                                |
| ------------------------------------- | ------ | --------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `ui` imports `@stackra/tokens`, a lib of its tier   |
| Secrets (ADR 0173)                    | N/A    | no secret involved                                  |
| Security                              | N/A    | presentation only                                   |
| HTTP and events                       | N/A    | no action or event                                  |
| Tenancy                               | N/A    | no tenant data                                      |
| Delegation                            | PASS   | builder session; separate reviewer                  |
| Not built yet (ADR 0227)              | PASS   | Expo modules already in the mobile catalog          |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                               |
| Versions and catalogs                 | PASS   | `catalog:mobile` entries, no catalog change         |
| Deploy modes (ADR 0076)               | PASS   | client rendering only                               |
| Licence tier (ADR 0077)               | PASS   | MIT package                                         |
| Docs and ADRs                         | PASS   | ADR 0319 decision 3 implemented; ui READMEs updated |

## Deploy modes

| Mode       | Behaviour                         |
| ---------- | --------------------------------- |
| SaaS       | the mobile app draws native glass |
| On-prem    | the mobile app draws native glass |
| Air-gapped | the mobile app draws native glass |

## Correctness properties

- **P-001**: Only secondary, tertiary and outline, enabled, get glass, and only as Liquid Glass; else solid — Validates: FR-001
- **P-002**: Either iOS setting, or no answer yet, makes every mounted button solid, and back — Validates: FR-002

## Contracts and events

None.

## Data and tenancy

None.

## Delegation and risk plan

R1: one builder, separate code review. One wave.

## ADRs

None new (ADR 0319 decision 3, ADR 0320 decision 7).

## Docs

`packages/design-system/ui/README.md`, `packages/design-system/ui/src/native/README.md`.

## Project structure

`packages/design-system/ui/src/native/{glass/use-glass-material.ts,glass/use-glass-button.tsx,button/button.tsx,close-button/close-button.tsx}`.
