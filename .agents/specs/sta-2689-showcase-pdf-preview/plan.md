# Implementation Plan: showcase: commit PdfPreview's generated API docs with their Arabic catalogue

**Spec**: `.agents/specs/sta-2689-showcase-pdf-preview/spec.md` · **Linear**: STA-2689 · **Date**: 2026-11-10

**Input**: Feature specification from `.agents/specs/sta-2689-showcase-pdf-preview/spec.md`

## Summary

Commit gen's three showcase files for PdfPreview exactly as the release flow's gen wrote them, and add the four
Arabic catalogue entries beside the English ones.

## Technical Context

- **Language**: JSON
- **Members**: `packages/design-system/showcase`
- **Testing**: Validate's catalogue check on CI
- **Storage**: none
- **Runtime target**: the showcase

## Constitution Check

| Law                                   | Result | Note                         |
| ------------------------------------- | ------ | ---------------------------- |
| Boundaries (tier direction, ADR 0003) | N/A    | generated docs               |
| Secrets (ADR 0009)                    | N/A    | none                         |
| Security                              | N/A    | none                         |
| HTTP and events                       | N/A    | none                         |
| Tenancy                               | N/A    | none                         |
| Delegation                            | PASS   | Claude only                  |
| Not built yet (ADR 0011)              | N/A    | none                         |
| Test placement (ADR 0022)             | N/A    | no tests                     |
| Versions and catalogs                 | N/A    | no member release change     |
| Deploy modes (ADR 0076)               | N/A    | none                         |
| Licence tier (ADR 0077)               | PASS   | free, MIT                    |
| Docs and ADRs                         | PASS   | the showcase docs themselves |

## Deploy modes

| Mode       | Behaviour |
| ---------- | --------- |
| SaaS       | unchanged |
| On-prem    | unchanged |
| Air-gapped | unchanged |

## Correctness properties

- **P-001**: the release flow's gen leaves the showcase files unchanged — Validates: AC-001
- **P-002**: the Arabic and English PdfPreview key sets are equal — Validates: AC-002

## Architecture overview

Generated files plus one translation; nothing else.

## Components and responsibilities

- the showcase's generated API docs and its Arabic catalogue.

## Files and folders

```text
packages/design-system/showcase/api/index.json
packages/design-system/showcase/api/react/free/pdf-preview.json
packages/design-system/showcase/assets/lang/en/api.json
packages/design-system/showcase/assets/lang/ar/api.json
```

## Data models and migrations

none

## Contracts

none

## Error handling

none

## Security and tenancy

none

## Testing strategy

- AC-001, AC-002: Validate's catalogue check on this branch and on #946 after it refreshes.

## Rollout

Merged before the Version Packages pull request #946, which then refreshes with no showcase change.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R1.

## ADRs

none

## Docs

none

## Complexity tracking

none
