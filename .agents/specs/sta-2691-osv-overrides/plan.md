# Implementation Plan: deps: lift fast-xml-parser and node-forge past tonight's advisories

**Spec**: `.agents/specs/sta-2691-osv-overrides/spec.md` · **Linear**: STA-2691 · **Date**: 2026-11-11

**Input**: Feature specification from `.agents/specs/sta-2691-osv-overrides/spec.md`

## Summary

Two `pnpm-workspace.yaml` overrides in the ADR 0174 block: `node-forge@<1.4.3` → `1.4.3` (replacing `<1.4.1` →
`1.4.1`) and `fast-xml-parser@>=5.0.0 <5.12.0` → `5.12.0`. The `regen` label lets CI write the lockfile.

## Technical Context

- **Language**: YAML
- **Members**: the workspace root
- **Testing**: the Quality Gate's dependency scan and install
- **Storage**: none
- **Runtime target**: every member's resolved dependencies

## Constitution Check

| Law                                   | Result | Note                                   |
| ------------------------------------- | ------ | -------------------------------------- |
| Boundaries (tier direction, ADR 0003) | N/A    | none                                   |
| Secrets (ADR 0009)                    | N/A    | none                                   |
| Security                              | PASS   | two advisories closed                  |
| HTTP and events                       | N/A    | none                                   |
| Tenancy                               | N/A    | none                                   |
| Delegation                            | PASS   | Claude only                            |
| Not built yet (ADR 0011)              | N/A    | none                                   |
| Test placement (ADR 0022)             | N/A    | none                                   |
| Versions and catalogs                 | PASS   | ADR 0174 overrides, the lockfile by CI |
| Deploy modes (ADR 0076)               | N/A    | none                                   |
| Licence tier (ADR 0077)               | PASS   | free, MIT                              |
| Docs and ADRs                         | N/A    | none                                   |

## Deploy modes

| Mode       | Behaviour |
| ---------- | --------- |
| SaaS       | unchanged |
| On-prem    | unchanged |
| Air-gapped | unchanged |

## Correctness properties

- **P-001**: no vulnerable version resolves — Validates: AC-001, AC-002

## Architecture overview

Overrides only.

## Components and responsibilities

- the ADR 0174 override block.

## Files and folders

```text
pnpm-workspace.yaml
pnpm-lock.yaml
```

## Data models and migrations

none

## Contracts

none

## Error handling

none

## Security and tenancy

The two advisories are closed.

## Testing strategy

- AC-001, AC-002: the Quality Gate's install and OSV-Scanner step.

## Rollout

Merged first; #1027 and every other core pull request then merge main.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R1.

## ADRs

none

## Docs

none

## Complexity tracking

none
