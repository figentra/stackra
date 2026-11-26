# Implementation Plan: an app's i18n catalogue loaders import JSON its bundler can serve

**Spec**: `.agents/specs/sta-2671-app-i18n-json/spec.md` · **Linear**: STA-2671 · **Date**: 2026-11-10

**Input**: Feature specification from `.agents/specs/sta-2671-app-i18n-json/spec.md`

## Summary

`emitI18n` writes the `{ with: { type: "json" } }` attribute only for a member that is not an app. An app's bundler
(Vite, Metro) loads the JSON itself, and the base tsconfig preset resolves a JSON import without the attribute.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/developer/gen` (developer)
- **Testing**: vitest in `src/**/__tests__/`, on CI
- **Storage**: none
- **Runtime target**: the generated `#stackra/i18n` of every member

## Constitution Check

| Law                                   | Result | Note                             |
| ------------------------------------- | ------ | -------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | no new import between members    |
| Secrets (ADR 0009)                    | N/A    | none                             |
| Security                              | N/A    | none                             |
| HTTP and events                       | N/A    | none                             |
| Tenancy                               | N/A    | none                             |
| Delegation                            | PASS   | Claude only                      |
| Not built yet (ADR 0011)              | N/A    | none                             |
| Test placement (ADR 0022)             | PASS   | the test stays in `__tests__/`   |
| Versions and catalogs                 | PASS   | a changeset patches @stackra/gen |
| Deploy modes (ADR 0076)               | PASS   | same in all three                |
| Licence tier (ADR 0077)               | PASS   | free, MIT                        |
| Docs and ADRs                         | N/A    | no rule changes                  |

## Deploy modes

| Mode       | Behaviour                                        |
| ---------- | ------------------------------------------------ |
| SaaS       | an app's catalogues load in dev and in its build |
| On-prem    | an app's catalogues load in dev and in its build |
| Air-gapped | an app's catalogues load; no network call added  |

## Correctness properties

- **P-001**: an app's generated loaders hold no `with: { type: "json" }` — Validates: AC-001
- **P-002**: a service's or package's loaders keep the attribute — Validates: AC-002

## Architecture overview

`emitI18n` builds one loader line per namespace and locale. The line's import attribute now depends on `ir.layout`;
the specifiers, the key tree and `loadMessages` are unchanged.

## Components and responsibilities

- `emitI18n`: chooses the attribute by layout.

## Files and folders

```text
packages/developer/gen/
  src/core/functions/emit-i18n.function.ts
  src/core/functions/__tests__/emit-i18n.function.test.ts
.changeset/gen-app-i18n-json.md
```

## Data models and migrations

none

## Contracts

none changed: an app's generated loaders lose the attribute; their type and value are the same.

## Error handling

none changed.

## Security and tenancy

none

## Testing strategy

- AC-001: an app member's emitted loaders in `emit-i18n.function.test.ts`.
- AC-002: the existing service and package cases keep their attribute (and the golden files are unchanged).

## Rollout

A patch changeset for `@stackra/gen`, in 0.33.x; an app regenerates once.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R1.

## ADRs

none

## Docs

none

## Complexity tracking

none
