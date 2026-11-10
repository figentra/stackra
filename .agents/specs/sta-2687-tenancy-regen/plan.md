# Implementation Plan: tenancy: restore the generated TenantDataKey optional fields CI's gen writes

**Spec**: `.agents/specs/sta-2687-tenancy-regen/spec.md` · **Linear**: STA-2687 · **Date**: 2026-11-10

**Input**: Feature specification from `.agents/specs/sta-2687-tenancy-regen/spec.md`

## Summary

Revert the two tenancy files #1030 regenerated on a Testbed box to the output CI's gen writes (the `[OptionalProps]`
augmentation and `optional: ["id", "tenantId"]`), and label the pull request `regen` so CI's own gen commits the
canonical files if anything else differs.

## Technical Context

- **Language**: TypeScript (generated) and JSON
- **Members**: `packages/security/tenancy`
- **Testing**: the Quality Gate's manifest check
- **Storage**: none
- **Runtime target**: the 0.33.0 release

## Constitution Check

| Law                                   | Result | Note                                |
| ------------------------------------- | ------ | ----------------------------------- |
| Boundaries (tier direction, ADR 0003) | N/A    | generated files only                |
| Secrets (ADR 0009)                    | N/A    | none                                |
| Security                              | N/A    | none                                |
| HTTP and events                       | N/A    | none                                |
| Tenancy                               | PASS   | no schema change                    |
| Delegation                            | PASS   | Claude only                         |
| Not built yet (ADR 0011)              | N/A    | none                                |
| Test placement (ADR 0022)             | N/A    | no tests change                     |
| Versions and catalogs                 | N/A    | #1019's changeset already covers it |
| Deploy modes (ADR 0076)               | N/A    | none                                |
| Licence tier (ADR 0077)               | PASS   | free, MIT                           |
| Docs and ADRs                         | N/A    | none                                |

## Deploy modes

| Mode       | Behaviour |
| ---------- | --------- |
| SaaS       | unchanged |
| On-prem    | unchanged |
| Air-gapped | unchanged |

## Correctness properties

- **P-001**: CI's gen leaves the two files unchanged — Validates: AC-001, AC-002

## Architecture overview

Generated files only; CI's gen is the reference the gate compares against.

## Components and responsibilities

- the two generated tenancy files.

## Files and folders

```text
packages/security/tenancy/src/node/entities.gen.ts
packages/security/tenancy/stackra.manifest.json
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

- AC-001, AC-002: the Quality Gate's "Committed manifests match gen" step.

## Rollout

Merged before the Version Packages pull request #946, whose gate on main needs it.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R1.

## ADRs

none

## Docs

none

## Complexity tracking

none
