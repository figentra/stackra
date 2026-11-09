# Implementation Plan: the identity lock as a table

**Spec**: `.agents/specs/sta-2057-identity-lock-table/spec.md` · **Linear**: STA-2057 · **Date**: 2026-11-03

**Input**: Feature specification from `.agents/specs/sta-2057-identity-lock-table/spec.md`

## Summary

`checkIdentityLock` reads a `LOCKS` table instead of the `LOCKED` section-to-field map. Each row says how to read a
section's own entries as `{ subject, identity, file, module }`, plus an optional `accepts(before, after)` (the event
version bump) and an optional `sanctions(old, before)` (the permission set prefix, the endpoint path). New rows lock
permissions, roles, config, schemas, endpoints and reports. `compareManifests` matches a previous event to a bumped
one by written name. `IDENTITY_KINDS` gains `report`.

## Technical Context

- **Language**: TypeScript (ESM), Node 24 (`mise.toml`)
- **Members**: `packages/developer/gen` (`tier:lib`); `packages/foundation/validation` (`tier:lib`)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); the golden runner `src/node/__tests__/golden.test.ts`
- **Storage**: none
- **Runtime target**: a library (gen, run by `stackra gen --check`)

## Constitution Check

| Law                                   | Result | Note                                           |
| ------------------------------------- | ------ | ---------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | gen and validation only; no new imports        |
| Secrets (ADR 0009)                    | N/A    | no secret is read or named                     |
| Security                              | PASS   | locks permission keys against silent renames   |
| HTTP and events                       | PASS   | locks endpoints; accepts ADR 0305's event bump |
| Tenancy                               | N/A    | no tenant data                                 |
| Delegation                            | PASS   | one agent, one worktree                        |
| Not built yet (ADR 0011)              | PASS   | nothing new introduced                         |
| Test placement (ADR 0022)             | PASS   | `__tests__/` beside each subject               |
| Versions and catalogs                 | N/A    | no dependency change                           |
| Deploy modes (ADR 0076)               | N/A    | build-time check                               |
| Licence tier (ADR 0077)               | PASS   | free                                           |
| Docs and ADRs                         | PASS   | README rows; no ADR needed                     |

## Deploy modes

| Mode       | Behaviour                |
| ---------- | ------------------------ |
| SaaS       | same: a build-time check |
| On-prem    | same                     |
| Air-gapped | same                     |

## Correctness properties

- **P-001**: for each new row, a changed identity of a kept subject without a matching rename yields exactly one `identity_changed`, and a matching rename yields none — Validates: FR-002, FR-003, FR-004, FR-005
- **P-002**: an integration event whose written name stays and version grows yields no lock error and no `compareManifests` removal; a lower version yields `identity_changed` — Validates: FR-006, FR-007
- **P-003**: a class is reported at most once across rows; an action whose key changed gets no endpoint error, a model whose key changed gets no schema error — Validates: FR-009
- **P-004**: unchanged manifests, removed subjects, hosted entries (`from`) other than config, generated entries and duplicated schema names yield nothing — Validates: FR-001
- **P-005**: `@Renamed("x")` on a class built from `Report(...)` does not throw — Validates: FR-008

## Architecture overview

`generateMember` calls `checkIdentityLock(previous, manifest, renames)` when a committed manifest exists. The function
walks `LOCKS`; for each row it maps the previous and next manifest to `subject → { identity, file, module }`, skips
subjects already judged, and compares. `compareManifests` stays a separate function used by `expectBackwardCompatible`.

## Components and responsibilities

- `LOCKS` (module constant in `check-identity-lock.function.ts`): the rows. Existing sections keep `class` as subject
  and their field as identity. New rows:
  - `permissions`: subject `<class>.<member>`, identity `key`; `sanctions` also accepts `old` when the key starts
    with `<old>.` (the set prefix).
  - `roles`, `reports`: subject `class`, identity `key`.
  - `config`: subject `class`, identity `key`; `from` is an import specifier here, so the own filter is off.
  - `schemas`: the `schemas` map; subject is the name after the module key; names seen twice and enum entries are
    skipped.
  - `endpoints`: the `actions` section; identity `<method> <path>` from an object `endpoint`; `sanctions` also accepts
    the bare path.
  - `events`: `accepts` returns true when both names end `.v<n>`, share the stem, and the new `n` is greater.
- The own filter skips `from` entries (hosted) and entries whose `file` starts with `.stackra/` (generated).
- `compareManifests`: when `nextEvents` lacks `event.name`, find a next event with the same stem and a higher version;
  if found, skip `removed` and the field comparison and run the changes rule against it.
- `IDENTITY_KINDS`: add `"report"`.

## Files and folders

- `packages/developer/gen/src/core/functions/check-identity-lock.function.ts` (the table; file contract updated)
- `packages/developer/gen/src/core/functions/compare-manifests.function.ts` (the bump match)
- `packages/developer/gen/src/core/functions/__tests__/check-identity-lock.function.test.ts`
- `packages/developer/gen/src/core/functions/__tests__/compare-manifests.function.test.ts`
- `packages/developer/gen/src/node/__tests__/golden.test.ts` (one `FIXTURES` row)
- `packages/developer/gen/__golden__/refusal-identity-changed/` (input overlay, `refusals.json.golden`, expected)
- `packages/developer/gen/__golden__/README.md`, `packages/developer/gen/README.md`
- `packages/foundation/validation/src/core/constants/identity-kinds.constant.ts` and its test
- `.changeset/identity-lock-table.md` (gen and validation, patch)

## Data models and migrations

none

## Contracts

No manifest field changes. `stackra gen --check` gains `identity_changed` refusals for the new rows (code unchanged).
`checkIdentityLock` and `compareManifests` keep their signatures.

## Error handling

`identity_changed` with `file` (the entry's file, or `stackra.manifest.json` when the entry has none), `subject`
(the class, or `<class>.<member>` for a permission), the message "the locked identity `<before>` became `<after>`" and
the fix "add @Renamed(<before>) to <class>, or restore the identity"; the endpoint fix also names `endpoint: { method,
path }` to keep a route.

## Security and tenancy

A permission key change now needs `@Renamed`, so stored grants are not stranded by a module folder rename. No tenant
data.

## Testing strategy

- AC-001, AC-004: `check-identity-lock.function.test.ts`, one case per new row (refused, renamed, unchanged).
- AC-002: the bump case in both unit tests, plus the lower-version refusal.
- AC-003: the `refusal-identity-changed` fixture over `service`: its committed manifest locks a different key for
  `CancelOrderAction` and for `OrderPermissions.read`; `refusals.json.golden` lists both `identity_changed`.
- AC-005: the validation package's `@Renamed` test marks a report-kind class.
- All of it runs on ci-box: `pnpm --filter @stackra/gen test`, `pnpm --filter @stackra/validation test`, typecheck and
  lint of both, then `UPDATE_GOLDEN=1` once for the new fixture and a compare run.

## Rollout

A patch changeset for `@stackra/gen` and `@stackra/validation`. A member whose committed manifest already disagrees
fails `gen --check` until it regenerates; the goldens and this repository's members are regenerated in the same PR if
any disagree.

## Delegation and risk plan

One agent; gen and validation only. The work stays clear of emit-boot, emit-registrations and build-manifest (owned
by STA-2044 to STA-2047), so no merge order applies. Size M.

## ADRs

ADR 0294 (decisions 20, 21, 22), ADR 0132 (note: a permission rename needs `@Renamed`), ADR 0305 (rule 5: version and
Change) — all accepted.

## Docs

`packages/developer/gen/README.md` (locked identities row), `packages/developer/gen/__golden__/README.md` (fixture
row).

## Complexity tracking

none
