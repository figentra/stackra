# Implementation Plan: iOS form-factor rules for the iPhone Duo and resizable windows

**Spec**: `.agents/specs/sta-461-iphone-duo-form-factor/spec.md` · **Linear**: STA-461 · **Date**: 2026-10-24

## Summary

The mobile app's and the template's `app.json` set `"orientation": "default"` and add `expo-build-properties` with
`ios.enableSceneSupport`; `validate-repository` gains `checkIosFormFactor` (Expo app configs) and `checkWindowSizing`
(app source).

## Technical Context

- **Language**: JSON config; Node (the validator)
- **Members**: `apps/mobile`; `tools/scaffold`; `tools/scripts`
- **Testing**: `node --test` in `tools/scripts/__tests__/`
- **Storage**: none
- **Runtime target**: iOS (the app); Node (the validator)

## Constitution Check

| Law                                   | Result | Note                                           |
| ------------------------------------- | ------ | ---------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | N/A    | config and a script                            |
| Secrets (ADR 0173)                    | N/A    | no secret involved                             |
| Security                              | N/A    | layout only                                    |
| HTTP and events                       | N/A    | no action or event                             |
| Tenancy                               | N/A    | no tenant data                                 |
| Delegation                            | PASS   | builder session; separate reviewer             |
| Not built yet (ADR 0227)              | PASS   | an Expo config plugin, no new technology class |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                          |
| Versions and catalogs                 | PASS   | one `mobile` catalog entry, owner-reviewed     |
| Deploy modes (ADR 0076)               | PASS   | client config only                             |
| Licence tier (ADR 0077)               | PASS   | the private app and the template               |
| Docs and ADRs                         | N/A    | the ADRs are adr-wave's (STA-469)              |

## Deploy modes

| Mode       | Behaviour                       |
| ---------- | ------------------------------- |
| SaaS       | the iOS app rotates and resizes |
| On-prem    | the iOS app rotates and resizes |
| Air-gapped | the iOS app rotates and resizes |

## Correctness properties

- **P-001**: The app and the template lock no orientation and adopt the scene lifecycle — Validates: FR-001
- **P-002**: The validator reports an orientation lock, a full-screen request and `Dimensions.get` — Validates: FR-002

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

`apps/mobile/app.json`, `tools/scaffold/templates/apps/mobile/app.json`, `tools/scripts/validate-repository.mjs`.
