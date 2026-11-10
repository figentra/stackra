# Implementation Plan: release: the 0.33.0 set in one merge

**Spec**: `.agents/specs/sta-2685-release-0-33-0-set/spec.md` · **Linear**: STA-2685 · **Date**: 2026-11-10

**Input**: Feature specification from `.agents/specs/sta-2685-release-0-33-0-set/spec.md`

## Summary

Branch off main, merge the nine reviewed branches in order, add this spec folder, run one Testbed gate dry-run,
push, open one pull request. The owner merges it; the leader closes the nine as merged via it.

## Technical Context

- **Language**: as the nine (TypeScript, Node scripts, MDX)
- **Members**: as the nine
- **Testing**: the nine's own tests; one Testbed gate dry-run; the Quality Gate on CI
- **Storage**: none
- **Runtime target**: the 0.33.0 release

## Constitution Check

| Law                                   | Result | Note                            |
| ------------------------------------- | ------ | ------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | as reviewed in each of the nine |
| Secrets (ADR 0009)                    | PASS   | none added                      |
| Security                              | PASS   | as reviewed in each of the nine |
| HTTP and events                       | PASS   | as reviewed in each of the nine |
| Tenancy                               | PASS   | as reviewed in #1019 and #986   |
| Delegation                            | PASS   | Claude only                     |
| Not built yet (ADR 0011)              | N/A    | none                            |
| Test placement (ADR 0022)             | PASS   | as the nine                     |
| Versions and catalogs                 | PASS   | the nine's changesets           |
| Deploy modes (ADR 0076)               | PASS   | as the nine                     |
| Licence tier (ADR 0077)               | PASS   | free, MIT                       |
| Docs and ADRs                         | PASS   | the nine's own notes            |

## Deploy modes

| Mode       | Behaviour   |
| ---------- | ----------- |
| SaaS       | as the nine |
| On-prem    | as the nine |
| Air-gapped | as the nine |

## Correctness properties

- **P-001**: the branch's diff against main equals the union of the nine pull requests' diffs plus this folder —
  Validates: AC-001
- **P-002**: the combined dry-run and the gate are green — Validates: AC-002

## Architecture overview

Merge commits only; no change is authored here except this spec folder.

## Components and responsibilities

- the nine pull requests: their changes, specs, changesets and tests.
- this branch: their order and one gate run.

## Files and folders

```text
.agents/specs/sta-2685-release-0-33-0-set/{spec,plan,tasks}.md
```

## Data models and migrations

none beyond the nine.

## Contracts

none beyond the nine.

## Error handling

A conflict between two of the nine is resolved once here and named in the pull request body.

## Security and tenancy

As reviewed in each of the nine.

## Testing strategy

- AC-001: `git diff` against main per merge; the nine heads are ancestors of the branch head.
- AC-002: one Testbed gate dry-run, then the Quality Gate.

## Rollout

The owner merges it; the Version Packages pull request #946 then cuts 0.33.0 on the leader's word.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R2.

## ADRs

none

## Docs

none

## Complexity tracking

none
