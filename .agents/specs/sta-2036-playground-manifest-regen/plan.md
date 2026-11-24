# Implementation Plan: playground: regenerate the committed manifest and OpenAPI document after the API-area prefix

**Spec**: `.agents/specs/sta-2036-playground-manifest-regen/spec.md` · **Linear**: STA-2036 · **Date**: 2026-11-24

**Input**: Feature specification from `.agents/specs/sta-2036-playground-manifest-regen/spec.md`

## Summary

Commit the two files `stackra gen` writes for `apps/playground`, exactly as gen wrote them, so the committed contract
equals the derived one. No source file changes.

## Technical Context

- **Language**: JSON (generated)
- **Members**: `apps/playground`
- **Testing**: `stackra gen --check` in the member; the CI step "Committed manifests match gen"
- **Storage**: none
- **Runtime target**: none; no code reads these files

## Constitution Check

| Law                                   | Result | Note                                     |
| ------------------------------------- | ------ | ---------------------------------------- |
| Boundaries (tier direction, ADR 0003) | N/A    | generated files                          |
| Secrets (ADR 0009)                    | N/A    | none                                     |
| Security                              | N/A    | none                                     |
| HTTP and events                       | PASS   | paths take the ADR 0082 area prefix      |
| Tenancy                               | N/A    | none                                     |
| Delegation                            | PASS   | Claude only                              |
| Not built yet (ADR 0011)              | N/A    | none                                     |
| Test placement (ADR 0022)             | N/A    | no tests; `gen --check` is the check     |
| Versions and catalogs                 | N/A    | no member release change                 |
| Deploy modes (ADR 0076)               | N/A    | none                                     |
| Licence tier (ADR 0077)               | PASS   | free                                     |
| Docs and ADRs                         | PASS   | none to change; ADR 0082 already says so |

## Deploy modes

| Mode       | Behaviour |
| ---------- | --------- |
| SaaS       | unchanged |
| On-prem    | unchanged |
| Air-gapped | unchanged |

## Correctness properties

- **P-001**: the committed files equal gen's output for the member — Validates: AC-001, AC-002
- **P-002**: gen leaves the committed files unchanged on a second run — Validates: AC-004
- **P-003**: the set of action, event, permission, error and model identities and of OpenAPI operation ids is the same before and after — Validates: AC-003

## Architecture overview

Two generated artifacts of one member; the change is the output of one command run over the current sources.

## Components and responsibilities

- `stackra gen` writes `stackra.manifest.json` (the member's committed contract) and `openapi.json`.
- `stackra gen --check` compares them with what gen would write.

## Files and folders

```text
apps/playground/stackra.manifest.json
apps/playground/openapi.json
.agents/specs/sta-2036-playground-manifest-regen/spec.md
.agents/specs/sta-2036-playground-manifest-regen/plan.md
.agents/specs/sta-2036-playground-manifest-regen/tasks.md
```

## Data models and migrations

none

## Contracts

The playground's generated contract: endpoint paths gain the `/app` area prefix (9 of 12 endpoints; each is `/app` plus
the old path, methods unchanged), 10 actions gain `area: app`, 2 drivers and 17 routes are added. No action, event,
permission, error or model identity and no OpenAPI operation id changes. Nothing in the repository consumes the files.

## Error handling

none

## Security and tenancy

none

## Testing strategy

- AC-001, AC-002: `stackra gen --check` in `apps/playground` fails on main (both files stale) and reports the member up
  to date on this branch.
- AC-003: compare the identity sets of main's manifest and this branch's (counts and names), and the operation ids of both
  OpenAPI documents.
- AC-004: run `stackra gen` in the member again and see an empty `git status`.

## Rollout

Merged as one commit. Every lane's build stops dirtying the playground's two files.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R1.

## ADRs

none

## Docs

none

## Complexity tracking

none
