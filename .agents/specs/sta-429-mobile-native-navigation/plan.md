# Implementation Plan: Mobile navigation feels native: a search tab and a tab bar that minimizes on scroll

**Spec**: `.agents/specs/sta-429-mobile-native-navigation/spec.md` · **Linear**: STA-429 · **Date**: 2026-10-25

## Summary

`tab-navigator.tsx` sets `minimizeBehavior="onScrollDown"` and, in development builds, adds a Search tab with
`role: "search"` holding one native-stack screen. The screen's header search reuses the landing's rule, moved to
`components/ui/match-pages.ts`, and opens a match in the Home tab.

## Technical Context

- **Language**: TypeScript, React Native
- **Members**: `apps/mobile`
- **Testing**: manual on an iOS 26 device
- **Storage**: none
- **Runtime target**: iOS and Android

## Constitution Check

| Law                                   | Result | Note                                        |
| ------------------------------------- | ------ | ------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | the app imports libs only                   |
| Secrets (ADR 0173)                    | N/A    | no secret involved                          |
| Security                              | N/A    | navigation chrome                           |
| HTTP and events                       | N/A    | no action or event                          |
| Tenancy                               | N/A    | no tenant data                              |
| Delegation                            | PASS   | builder session; separate reviewer          |
| Not built yet (ADR 0227)              | PASS   | code-based React Navigation, no expo-router |
| Test placement (ADR 0022)             | N/A    | no tests                                    |
| Versions and catalogs                 | N/A    | no dependency change                        |
| Deploy modes (ADR 0076)               | PASS   | client only                                 |
| Licence tier (ADR 0077)               | PASS   | the private app                             |
| Docs and ADRs                         | PASS   | the app README                              |

## Deploy modes

| Mode       | Behaviour                                |
| ---------- | ---------------------------------------- |
| SaaS       | the tab bar minimizes on scroll (iOS 26) |
| On-prem    | the tab bar minimizes on scroll (iOS 26) |
| Air-gapped | the tab bar minimizes on scroll (iOS 26) |

## Correctness properties

- **P-001**: The tab navigator minimizes on scroll down — Validates: FR-001
- **P-002**: The Search tab exists only in development builds and opens matches in the Home tab — Validates: FR-002

## Contracts and events

None.

## Data and tenancy

None.

## Delegation and risk plan

R1: one builder, separate code review. One wave.

## ADRs

None new.

## Docs

`apps/mobile/README.md`.

## Project structure

`apps/mobile/src/navigation/{tab-navigator.tsx,types.ts,linking.ts}`, `apps/mobile/src/screens/search-screen.tsx`,
`apps/mobile/src/components/ui/match-pages.ts`, `apps/mobile/src/screens/design-system-screen.tsx`.
