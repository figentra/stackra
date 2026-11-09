# Implementation Plan: the sort and filter index checks judge this run's resource trees

**Spec**: `.agents/specs/sta-2066-table-index-checks-current/spec.md` · **Linear**: STA-2066 · **Date**: 2026-11-03

**Input**: Feature specification from `.agents/specs/sta-2066-table-index-checks-current/spec.md`

## Summary

`generateMember` passes this run's `manifest` to `checkTableIndexes` instead of `previous`. The function's parameter
and file contract say it reads the manifest this run derives. A test drives `generateMember` with a resource tree and
no committed manifest.

## Technical Context

- **Language**: TypeScript (ESM), Node 24 (`mise.toml`)
- **Members**: `packages/developer/gen` (`tier:lib`)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022)
- **Storage**: none
- **Runtime target**: a library (gen, run by `stackra gen`)

## Constitution Check

| Law                                   | Result | Note                            |
| ------------------------------------- | ------ | ------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | gen only; no new imports        |
| Secrets (ADR 0009)                    | N/A    | no secret is read or named      |
| Security                              | N/A    | a build-time index check        |
| HTTP and events                       | N/A    | no endpoint or event            |
| Tenancy                               | N/A    | no tenant data                  |
| Delegation                            | PASS   | one agent, one worktree         |
| Not built yet (ADR 0011)              | PASS   | nothing new introduced          |
| Test placement (ADR 0022)             | PASS   | `__tests__/` beside the subject |
| Versions and catalogs                 | N/A    | no dependency change            |
| Deploy modes (ADR 0076)               | N/A    | build-time check                |
| Licence tier (ADR 0077)               | PASS   | free                            |
| Docs and ADRs                         | PASS   | file contracts only; no ADR     |

## Deploy modes

| Mode       | Behaviour                |
| ---------- | ------------------------ |
| SaaS       | same: a build-time check |
| On-prem    | same                     |
| Air-gapped | same                     |

## Correctness properties

- **P-001**: for an IR whose recorded tree sorts on an unindexed path, `generateMember(ir)` with no committed manifest returns no files and `sort_not_indexed` — Validates: FR-001
- **P-002**: a committed manifest's tree that this run does not record yields no refusal — Validates: FR-002

## Architecture overview

`buildManifest(ir)` records `ui.resources` from `ir.resourceTrees` (read by `readResourceTrees` before gen-core runs).
`generateMember` then runs its full-pass checks; `checkTableIndexes` now reads the trees from that manifest, as
`clientToolsOf` already does.

## Components and responsibilities

- `checkTableIndexes(ir, manifest)`: the parameter is renamed from `previous` to `manifest`; its doc and file contract
  say "this run's manifest". Logic unchanged.
- `generateMember`: the call passes `manifest`.

## Files and folders

- `packages/developer/gen/src/core/functions/check-table-indexes.function.ts`
- `packages/developer/gen/src/core/functions/generate-member.function.ts`
- `packages/developer/gen/src/core/functions/__tests__/check-table-indexes.function.test.ts`
- `.changeset/table-index-checks-current.md` (gen, patch)

## Data models and migrations

none

## Contracts

none: same refusal codes, same exported signature shape (`checkTableIndexes(ir, manifest?)`).

## Error handling

`sort_not_indexed` and `filter_not_indexed` are unchanged; they arrive one run earlier.

## Security and tenancy

none

## Testing strategy

- AC-001: a `generateMember` case with a resource class, its tree in `ir.resourceTrees` sorting on an unindexed path,
  and no committed manifest.
- AC-002: the same IR without the tree, given a committed manifest whose tree sorts unindexed: no refusal.
- The existing `checkTableIndexes` cases keep passing with the parameter renamed.
- Runs on ci-box: `pnpm --filter @stackra/gen test`, typecheck and lint.

## Rollout

A patch changeset for `@stackra/gen`.

## Delegation and risk plan

One agent; gen only. Clear of emit-boot, emit-registrations and build-manifest (STA-2044 to STA-2047). Size S.

## ADRs

ADR 0307 (rule 2 and Enforcement), ADR 0294 (decision 22) — accepted.

## Docs

none beyond the file contracts.

## Complexity tracking

none
