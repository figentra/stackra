# Implementation Plan: upgrade notes for the 0.30 to 0.33 minors, and a release-note rule that holds every breaking release to its note

**Spec**: `.agents/specs/sta-2835-upgrade-notes/spec.md` · **Linear**: STA-2835 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2835-upgrade-notes/spec.md`

## Summary

Write one upgrade note per release line from 0.30 to 0.33 under `apps/docs/src/docs/customers/upgrading/`, from the
changelog entries, and one for the pending 0.34 line from its pending changesets (STA-2797 marks a break in
`IdempotencyStore`), with an index and a "Versions to skip" table. Add the `release-notes` rule to `@stackra/repo-checks`'
`config` phase: `breakingReleases` finds each break-marked `@stackra/*` release from 0.30.0 on (and the pending one),
`checkReleaseNotes` wants its line's note with the five sections and a breaking patch named.

## Technical Context

- **Language**: TypeScript (ESM), MDX
- **Members**: `packages/developer/repo-checks`, `apps/docs`
- **Testing**: vitest in `src/node/functions/__tests__/`
- **Storage**: none
- **Runtime target**: a developer's machine and CI (`pnpm validate` through `stackra validate --repository`)

## Constitution Check

| Law                                   | Result | Note                                                              |
| ------------------------------------- | ------ | ----------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | repo-checks imports node built-ins only for this rule             |
| Secrets (ADR 0009)                    | N/A    | none                                                              |
| Security                              | PASS   | reads repository files only                                       |
| HTTP and events                       | N/A    | none                                                              |
| Tenancy                               | N/A    | none                                                              |
| Delegation                            | PASS   | Claude only                                                       |
| Not built yet (ADR 0011)              | PASS   | ADR 0013 Enforcement names the rule as live                       |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`, one per function                           |
| Versions and catalogs                 | PASS   | one minor changeset for `@stackra/repo-checks`; no new dependency |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                                 |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                         |
| Docs and ADRs                         | PASS   | notes, changelog page, release runbook, ADR 0013 Enforcement      |

## Deploy modes

| Mode       | Behaviour                                           |
| ---------- | --------------------------------------------------- |
| SaaS       | the notes are on the docs site; the rule runs in CI |
| On-prem    | the same                                            |
| Air-gapped | the same; the notes ship in the docs build          |

## Correctness properties

- **P-001**: a break-marked entry from the floor on makes its version breaking, once per commit; nothing else does —
  Validates: AC-002, AC-006
- **P-002**: a break-marked pending changeset names the newest released version moved by the largest pending bump —
  Validates: AC-003
- **P-003**: a note is complete when it has the five sections and names each breaking patch of its line — Validates:
  AC-004, AC-005
- **P-004**: this repository passes with its notes — Validates: AC-001, AC-006

## Architecture overview

Pure functions over file texts (`breakingReleases`, `checkReleaseNotes`, `releaseNotePath`) and one reader
(`releaseNoteFindings`) over the `RepoContext` file list, added to `configFindings`.

## Components and responsibilities

- `breakingReleases`: changelog entries and pending changesets with a break mark, by version.
- `checkReleaseNotes`: the findings for missing notes, sections and unnamed breaking patches.
- `releaseNotePath`: the note page of a version's release line.
- `releaseNoteFindings`: reads the files and returns `release-notes` raw findings.
- The five docs pages and their navigation group.

## Files and folders

```text
packages/developer/repo-checks/src/node/constants/release-break-pattern.constant.ts
packages/developer/repo-checks/src/node/constants/release-note-sections.constant.ts
packages/developer/repo-checks/src/node/constants/release-notes-floor.constant.ts
packages/developer/repo-checks/src/node/constants/release-notes-folder.constant.ts
packages/developer/repo-checks/src/node/functions/breaking-releases.function.ts
packages/developer/repo-checks/src/node/functions/check-release-notes.function.ts
packages/developer/repo-checks/src/node/functions/release-note-findings.function.ts
packages/developer/repo-checks/src/node/functions/release-note-path.function.ts
packages/developer/repo-checks/src/node/functions/config-findings.function.ts
packages/developer/repo-checks/src/node/types/breaking-release.type.ts
packages/developer/repo-checks/src/node/types/release-source.type.ts
packages/developer/repo-checks/src/node/index.ts
packages/developer/repo-checks/README.md
apps/docs/src/docs/customers/upgrading/index.mdx
apps/docs/src/docs/customers/upgrading/0-30.mdx
apps/docs/src/docs/customers/upgrading/0-31.mdx
apps/docs/src/docs/customers/upgrading/0-32.mdx
apps/docs/src/docs/customers/upgrading/0-33.mdx
apps/docs/src/docs/customers/upgrading/0-34.mdx
apps/docs/src/docs/customers/changelog.mdx
apps/docs/src/docs/runbooks/release.mdx
apps/docs/src/docs/adr/0013-versioning-and-release.mdx
apps/docs/src/config/docs.config.ts
.changeset/README.md
.changeset/release-notes-check.md
```

## Data models and migrations

none

## Contracts

A note lives at `apps/docs/src/docs/customers/upgrading/0-<minor>.mdx` (before 1.0.0) or `<major>.mdx` (from 1.0.0),
with `## What changes`, `## Pins`, `## Steps`, `## Verify` and `## Roll back`. A break mark is what
`RELEASE_BREAK_PATTERN` matches.

## Error handling

Each finding is one line `<page>: <what is missing>`; `stackra validate --repository` prints it and exits 1.

## Security and tenancy

none.

## Testing strategy

- AC-002, AC-006: `breaking-releases.function.test.ts`, `release-note-findings.function.test.ts`
- AC-003: `breaking-releases.function.test.ts`, `release-note-findings.function.test.ts`
- AC-004, AC-005: `check-release-notes.function.test.ts`, `release-note-path.function.test.ts`
- AC-002 wiring: `phase-findings.test.ts` (`configFindings` reports `release-notes`)
- AC-001, AC-006: `stackra validate --repository` on this repository, failing before the notes (four findings) and
  passing after

## Rollout

One minor changeset for `@stackra/repo-checks`. The notes are live with the next docs deploy.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R2.

## ADRs

ADR 0013 decision 5 (Enforcement line added); no new ADR.

## Docs

The five upgrade pages, the customer changelog, the release runbook, ADR 0013 Enforcement, `.changeset/README.md` and
the repo-checks README.

## Complexity tracking

none
