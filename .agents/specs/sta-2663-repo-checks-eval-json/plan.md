# Implementation Plan: a prompt's eval dataset stays .eval.json

**Spec**: `.agents/specs/sta-2663-repo-checks-eval-json/spec.md` · **Linear**: STA-2663 · **Date**: 2026-11-09

**Input**: Feature specification from `.agents/specs/sta-2663-repo-checks-eval-json/spec.md`

## Summary

`MUST_STAY_JSON` gains `(^|/)assets/ai/.+\.eval\.json$`, with the reason: `@stackra/ai` binds a prompt's evaluations
by that fixed asset name. The repository-checks test accepts an eval dataset and still flags another `assets/ai` JSON.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/developer/repo-checks`
- **Testing**: node:test in `src/**/__tests__/`, on CI
- **Storage**: none
- **Runtime target**: the `stackra validate` command

## Constitution Check

| Law                                   | Result | Note                             |
| ------------------------------------- | ------ | -------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | no new import                    |
| Secrets (ADR 0009)                    | N/A    | none                             |
| Security                              | N/A    | none                             |
| HTTP and events                       | N/A    | none                             |
| Tenancy                               | N/A    | none                             |
| Delegation                            | PASS   | Claude only                      |
| Not built yet (ADR 0011)              | N/A    | none                             |
| Test placement (ADR 0022)             | PASS   | the test stays in `__tests__/`   |
| Versions and catalogs                 | PASS   | a changeset patches repo-checks  |
| Deploy modes (ADR 0076)               | N/A    | none                             |
| Licence tier (ADR 0077)               | PASS   | free, MIT                        |
| Docs and ADRs                         | N/A    | the entry carries its own reason |

## Deploy modes

| Mode       | Behaviour                                  |
| ---------- | ------------------------------------------ |
| SaaS       | unchanged: a repository check, not runtime |
| On-prem    | unchanged: a repository check, not runtime |
| Air-gapped | unchanged: a repository check, not runtime |

## Correctness properties

- **P-001**: `checkJsonConfigs` returns no finding for `assets/ai/**/<stem>.eval.json` — Validates: AC-001
- **P-002**: `checkJsonConfigs` still flags another JSON under `assets/ai/` — Validates: AC-002

## Architecture overview

`checkJsonConfigs` asks every `*.json` not on `MUST_STAY_JSON` to become `.jsonc`. One more entry joins the list; the
check itself is unchanged.

## Components and responsibilities

- `MUST_STAY_JSON`: the JSON files whose reader takes no JSONC, each with its reason.

## Files and folders

```text
packages/developer/repo-checks/
  src/node/constants/must-stay-json.constant.ts
  src/node/functions/__tests__/repository-checks.test.ts
.changeset/repo-checks-eval-json.md
```

## Data models and migrations

none

## Contracts

none changed: the check accepts one more fixed name.

## Error handling

none changed: any other `*.json` still gets the same finding.

## Security and tenancy

none

## Testing strategy

- AC-001, AC-002: the `checkJsonConfigs` case in `repository-checks.test.ts` (one accepted path, one flagged).

## Rollout

A patch changeset for `@stackra/repo-checks`; Figentra OS's validate passes on its eval datasets after the release.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R0.

## ADRs

none

## Docs

none

## Complexity tracking

none
