# Implementation Plan: gen reads its own entities file as generated, not as an authored `[OptionalProps]`

**Spec**: `.agents/specs/sta-2688-gen-authored-optional/spec.md` · **Linear**: STA-2688 · **Date**: 2026-11-10

**Input**: Feature specification from `.agents/specs/sta-2688-gen-authored-optional/spec.md`

## Summary

The authored `[OptionalProps]` check in the source reader skips a declaration in `PACKAGE_ENTITIES_FILE`, the file gen
writes; any other declaration under `src/` is still the member's own. A fixture entities file in the model tests
holds gen's augmentation for a model, and the test expects the model's optional keys unchanged.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/developer/gen` (developer)
- **Testing**: vitest in `src/**/__tests__/`, on CI
- **Storage**: none
- **Runtime target**: gen, for every package with models

## Constitution Check

| Law                                   | Result | Note                             |
| ------------------------------------- | ------ | -------------------------------- |
| Boundaries (tier direction, ADR 0003) | N/A    | gen only                         |
| Secrets (ADR 0009)                    | N/A    | none                             |
| Security                              | N/A    | none                             |
| HTTP and events                       | N/A    | none                             |
| Tenancy                               | N/A    | none                             |
| Delegation                            | PASS   | Claude only                      |
| Not built yet (ADR 0011)              | N/A    | none                             |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`            |
| Versions and catalogs                 | PASS   | a changeset patches @stackra/gen |
| Deploy modes (ADR 0076)               | PASS   | same in all three                |
| Licence tier (ADR 0077)               | PASS   | free, MIT                        |
| Docs and ADRs                         | N/A    | none                             |

## Deploy modes

| Mode       | Behaviour                             |
| ---------- | ------------------------------------- |
| SaaS       | the same entities output on every run |
| On-prem    | the same entities output on every run |
| Air-gapped | the same entities output on every run |

## Correctness properties

- **P-001**: gen's own augmentation never counts as authored — Validates: AC-001
- **P-002**: a member's own augmentation still does — Validates: AC-002

## Architecture overview

One condition in the source reader; the constant already names the file.

## Components and responsibilities

- `createSourceReader`: the authored check.

## Files and folders

```text
packages/developer/gen/src/node/functions/create-source-reader.function.ts
packages/developer/gen/src/node/functions/__tests__/create-source-reader.function.test.ts
.changeset/gen-entities-file-not-authored.md
```

## Data models and migrations

none

## Contracts

none

## Error handling

none new

## Security and tenancy

none

## Testing strategy

- AC-001: a fixture `src/node/entities.gen.ts` with gen's augmentation for `Customer`; `Customer` keeps `["id"]`.
- AC-002: the existing `Receipt` test (STA-1750) still passes.

## Rollout

A patch changeset for `@stackra/gen`, in 0.33.1. Once it ships, every package's entities file is stable under gen.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R2.

## ADRs

none

## Docs

none

## Complexity tracking

none
