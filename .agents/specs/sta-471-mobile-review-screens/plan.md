# Implementation Plan: Mobile review screens for the waves 4-7 free components

**Spec**: `.agents/specs/sta-471-mobile-review-screens/spec.md` · **Linear**: STA-471 · **Date**: 2026-10-24

## Summary

One `<name>-screen.tsx` per component in `apps/mobile/src/screens/free/`, in the shape of the existing free screens,
registered in `design-system-components.ts`, `navigation/types.ts` and `navigation/linking.ts`.

## Technical Context

- **Language**: TypeScript, React Native
- **Members**: `apps/mobile`
- **Testing**: manual on a device (review pages)
- **Storage**: none
- **Runtime target**: iOS and Android

## Constitution Check

| Law                                   | Result | Note                                          |
| ------------------------------------- | ------ | --------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | the app imports `@stackra/ui/native` only     |
| Secrets (ADR 0173)                    | N/A    | no secret involved                            |
| Security                              | N/A    | demo state only                               |
| HTTP and events                       | N/A    | no action or event                            |
| Tenancy                               | N/A    | no tenant data                                |
| Delegation                            | PASS   | builder session; separate reviewer            |
| Not built yet (ADR 0227)              | PASS   | code-based React Navigation, no expo-router   |
| Test placement (ADR 0022)             | N/A    | no tests                                      |
| Versions and catalogs                 | PASS   | `@expo/ui` from the existing `mobile` catalog |
| Deploy modes (ADR 0076)               | N/A    | internal review app                           |
| Licence tier (ADR 0077)               | PASS   | the private app                               |
| Docs and ADRs                         | N/A    | none                                          |

## Deploy modes

| Mode       | Behaviour                    |
| ---------- | ---------------------------- |
| SaaS       | not shipped; internal review |
| On-prem    | not shipped; internal review |
| Air-gapped | not shipped; internal review |

## Correctness properties

- **P-001**: Each waves 4-7 free component has one catalogue row, route and deep link — Validates: FR-001
- **P-002**: The pages draw only `@stackra/ui` components — Validates: FR-002

## Contracts and events

None.

## Data and tenancy

None.

## Delegation and risk plan

R1: one builder, separate code review. One wave.

## ADRs

None new.

## Docs

None.

## Project structure

`apps/mobile/src/screens/free/`, `apps/mobile/src/screens/design-system-components.ts`,
`apps/mobile/src/navigation/{types,linking}.ts`, `apps/mobile/src/app.tsx`, `apps/mobile/package.json`.
