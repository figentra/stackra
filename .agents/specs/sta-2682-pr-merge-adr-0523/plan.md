# Implementation Plan: pr-merge: the gate and the ruleset are the merge condition (ADR 0523)

**Spec**: `.agents/specs/sta-2682-pr-merge-adr-0523/spec.md` · **Linear**: STA-2682 · **Date**: 2026-11-10

**Input**: Feature specification from `.agents/specs/sta-2682-pr-merge-adr-0523/spec.md`

## Summary

`blockers` drops the AI review (and the patch-id carry-over that served it) and gains two conditions: the ruleset's
merge state, unless the base has a merge queue, and the `hold` label. The script reads `mergeStateStatus` and the
queue before deciding, and reads reviews and label events only for a design or risk:R3 PR.

## Technical Context

- **Language**: JavaScript (Node ESM scripts)
- **Members**: the repository root (`tools/scripts`)
- **Testing**: `node --test tools/scripts/__tests__/*.test.mjs`, on CI
- **Storage**: none
- **Runtime target**: agent sessions merging through `pnpm pr:merge`

## Constitution Check

| Law                                   | Result | Note                                          |
| ------------------------------------- | ------ | --------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | N/A    | repository scripts                            |
| Secrets (ADR 0009)                    | PASS   | the token stays in the gh child's environment |
| Security                              | PASS   | the required gate stays; `--admin` never used |
| HTTP and events                       | N/A    | none                                          |
| Tenancy                               | N/A    | none                                          |
| Delegation                            | PASS   | Claude only                                   |
| Not built yet (ADR 0011)              | N/A    | none                                          |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                         |
| Versions and catalogs                 | N/A    | no member changes                             |
| Deploy modes (ADR 0076)               | N/A    | none                                          |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                     |
| Docs and ADRs                         | PASS   | ADR 0119 note; scripts README row             |

## Deploy modes

| Mode       | Behaviour          |
| ---------- | ------------------ |
| SaaS       | none: repo tooling |
| On-prem    | none: repo tooling |
| Air-gapped | none: repo tooling |

## Correctness properties

- **P-001**: each of the four conditions, alone, refuses — Validates: AC-001 to AC-004
- **P-002**: a green, open, CLEAN or queued PR without `hold` merges with no review at all — Validates: AC-005
- **P-003**: the design and risk:R3 owner gate is unchanged — Validates: AC-006

## Architecture overview

One pure function (`blockers`) decides; the entry reads the PR, its gate runs and the queue, then calls it.

## Components and responsibilities

- `blockers`: the conditions.
- the entry: the reads, then merge or enqueue.
- `bot-gh.mjs`: the retired `review` mode names the new condition.

## Files and folders

```text
tools/scripts/pr-merge.mjs
tools/scripts/__tests__/pr-merge.test.mjs
tools/scripts/bot-gh.mjs
tools/scripts/README.md
apps/docs/src/docs/adr/0119-merge-policy-and-release-authority.mdx
apps/docs/src/docs/adr/index.mdx
```

## Data models and migrations

none

## Contracts

`pnpm pr:merge [-R owner/repo] <n>` keeps its arguments and exit codes.

## Error handling

Each refusal names its fix (`BEHIND`: merge the base in; `UNKNOWN`: run again; `hold`: take the label off).

## Security and tenancy

The required Quality Gate stays the gate; GitHub's ruleset still enforces itself on the merge call.

## Testing strategy

- AC-001 to AC-006: `pr-merge.test.mjs`, one test per condition plus the kept owner gate and network tests.

## Rollout

Lands in the 0.33.0 set, first, so the rest of the set merges through it.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R2.

## ADRs

ADR 0119: an amendment note dated 2026-11-10.

## Docs

ADR 0119 and the scripts README.

## Complexity tracking

none
