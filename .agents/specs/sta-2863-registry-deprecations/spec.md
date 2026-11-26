# Feature Specification: deprecate known-bad versions and move dist-tags through the release workflow

**Feature Branch**: `figentra/sta-2863-registry-deprecations`

**Created**: 2026-11-26

**Status**: Implementing <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: feature

**Approver**: the CTO (technical stop; approval pending, recorded by the CTO, not by this branch)

**Linear**: STA-2863

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: No workflow could deprecate a published version or move a dist-tag, so known-bad versions installed with no
warning and `latest` could not be rolled back. On the registry today: 0.33.1 is a partial release (99 of 119 `@stackra`
packages have it, `latest` names it, and 50 of those versions cannot install because a dependency further down has no
0.33.1); 0.10.0 is a partial release (41 packages, 40 uninstallable); and `@stackra/container` 0.28.0 cannot inject
`Container`, which breaks data-maintenance, data-transfer and the outbox maintenance actions, while its changelog sends
consumers to a 0.28.1 that was never published (the fix is 0.29.0). Batch 8.4 of the 26 Nov readiness audit.

### Sources

- `workers/registry/README.md` (the deprecate and dist-tag routes; the publisher rows)
- `apps/docs/src/docs/runbooks/release.mdx` (Revert: "no workflow does either yet")
- `packages/foundation/container/CHANGELOG.md` (0.29.0 entry: "take 0.28.1")
- `workers/registry/src/publish/put-package.ts` (deprecate: a body with no attachment; `""` clears)
- ADR 0453 decisions 6 and 7 (dist-tag changes and deprecations need the publish token only the trusted publisher
  workflow obtains), ADR 0177 decision 6 (deprecation), ADR 0468 (the owner approves the `release` environment),
  ADR 0013 (published versions are immutable)
- FR-001 to FR-008: the PR's diff against `main` and its tests (`tools/scripts/__tests__/registry-maintain.test.mjs`,
  `workers/registry/src/publish/__tests__/registry-maintain.test.ts`, `repository-checks.test.ts`)
- A read-only `plan` and `scan` against the live registry on 2026-11-26: 242 actions to apply, 20 in place, 0 problems;
  90 uninstallable versions, every one planned

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: apps/docs (the release runbook only)
- **Services touched**: none
- **Packages touched**: packages/developer/repo-checks (`MUST_STAY_JSON` gains one row); workers/registry (a test and
  the README only, no Worker code)
- **Public contract change**: additive. A new `workflow_dispatch` input `registry_maintenance` (`none`, `plan`, `scan`,
  `apply`) on `.github/workflows/release.yml` with two new jobs (`registry-plan`, `registry-maintenance`); a new
  reviewed data file `tools/release/registry-actions.json`; a new script `tools/scripts/registry-maintain.mjs`; one new
  `MUST_STAY_JSON` row in `@stackra/repo-checks`. The push path and the `dry_run` / `prerelease` dispatches are
  unchanged.
- **Cross-service events**: none
- **Tenancy and data**: none. The registry's audit log records each write with the workflow run, as for a publish.
- **Security and privacy**: the writes need the same per-package publish token as a publish; only `release.yml` on
  `refs/heads/main` in the `release` environment can obtain it (publisher row), and the owner approves every `apply`.
  The ID token and each publish token are masked before any output and never written to a file. No personal data.
- **Secrets**: none (GitHub's OIDC ID token only; no stored secret)
- **ADR needed**: no (implements ADR 0453 decisions 6 and 7 and ADR 0177 decision 6 as written)
- **New dependencies**: none (the script uses node built-ins only, so the jobs install nothing)
- **Deploy modes**: same in all three (registry operation only)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `apps/docs/src/docs/runbooks/release.mdx` (new section "Deprecate a version or move a tag back",
  the known-bad table, Revert, the dispatch table, failures and checks), `workers/registry/README.md` (Publishing),
  a patch changeset for `@stackra/repo-checks`
- **Lane**: full (a new release-workflow path that writes to the production registry)
- **Change risk**: R2 (writes to the production registry; each run is approved by the owner)

## Glossary _(full lane)_

- **Actions file**: `tools/release/registry-actions.json`, the reviewed list of deprecations and tag moves.
- **Plan**: what an `apply` would write now, from the live registry, with what is already in place and any problem.
- **Compare-and-set tag move**: a tag is moved to `to` only while it names one of the entry's `from` versions.
- **Uninstallable version**: a published version whose dependency tree names an exact `@scope` version the registry
  does not have (ETARGET at install).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A known-bad version warns on install and `latest` goes back to a complete set (Priority: P1)

A consumer runs `pnpm add @stackra/app`. After the owner approves one `apply`, `latest` resolves to 0.33.0 for every
package, and anyone who pins 0.33.1, 0.10.0 or container 0.28.0 sees a deprecation message naming the version to take.

**Why this priority**: today `pnpm add` of two packages can mix 0.33.1 and 0.33.0 or fail with ETARGET.

**Independent Test**: run the script against the registry Worker in a test: publish a partial release, `apply`, then
read the full and the install packument and the audit log.

**Acceptance Scenarios**:

1. **Given** `latest` names a partial release, **When** `apply` runs as the release workflow, **Then** `latest` names
   the last complete version, the partial version carries the message in both packument forms, and the audit log has a
   `dist-tag.set` and a `deprecate` row naming the workflow's repository.
2. **Given** the same file, **When** `apply` runs from an environment the publisher row does not name, **Then** the
   OIDC exchange answers 403 and nothing changes.

---

### User Story 2 - A re-run after the next release never moves `latest` back (Priority: P1)

**Acceptance Scenarios**:

1. **Given** the next release moved `latest` to a new version, **When** the same `apply` runs again, **Then** the tag
   is left alone (`at <new>, not one of <from>; left alone`) and nothing is written.

---

### User Story 3 - The owner sees what will change before approving (Priority: P2)

**Acceptance Scenarios**:

1. **Given** a dispatch with `apply`, **When** the run starts, **Then** the read-only `Registry plan` job lists every
   write in its summary before the `Registry maintenance` job waits for the `release` approval.
2. **Given** an entry that names an exact package or version that is not published, or a `to` version that is missing,
   **When** the plan runs, **Then** it reports a problem and fails without writing.

---

### User Story 4 - A half-finished release is found (Priority: P2)

**Acceptance Scenarios**:

1. **Given** a version whose tree names an unpublished version, **When** `scan` runs, **Then** it is listed with what
   is missing, and the job fails while it is neither deprecated nor in the file.

---

### Edge Cases

- **EC-01**: `@scope/*` covers only the names that have the version; an exact name without it is a problem.
- **EC-02**: Two entries that give one version different messages, or two entries that move one tag, are a problem.
- **EC-03**: `message: ""` undeprecates.
- **EC-04**: A registry that answers a write with success but does not show it fails the run (`STILL PENDING`).
- **EC-05**: A transient failure (network, 429, 5xx) is retried with backoff; the writes are idempotent.
- **EC-06**: A run outside a job with `id-token: write` fails before any write.
- **EC-07**: The `@stackra-pro` scope is written only by `stackra-pro`'s own release workflow (its publisher row).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE actions file SHALL be refused, naming the entry and field, when it holds an unknown key, a range or
  non-exact version, a name that is not `@scope/name` or `@scope/*`, a missing issue or reason, a message over 500
  characters or with a control character, or a tag move whose `to` is one of its `from`.
- **FR-002**: WHEN `plan` runs THE script SHALL read the live packuments and the scope catalogue without a token and
  print every deprecation and tag move `apply` would write, what is already in place, and each problem; a problem
  exits 1.
- **FR-003**: THE script SHALL move a tag only while it names one of the entry's `from` versions.
- **FR-004**: WHEN `apply` runs THE script SHALL exchange the job's GitHub ID token for one publish token per package,
  mask each token before any other output, move the tags before writing the deprecations, then plan again and exit 1
  unless nothing is left.
- **FR-005**: WHEN `scan` runs THE script SHALL list every version whose dependency tree names an unpublished exact
  version of the scope, and exit 1 while one is neither deprecated nor planned.
- **FR-006**: THE release workflow SHALL offer a `registry_maintenance` dispatch whose plan job is read-only and whose
  write job runs only for `apply`, only on `main` and only in the `release` environment, in its own concurrency group,
  and SHALL run neither release job on such a dispatch.
- **FR-007**: THE actions file SHALL deprecate every `@stackra` 0.33.1 and 0.10.0 and container, data-maintenance and
  data-transfer 0.28.0, each with the version to take, and SHALL move `latest` from 0.33.1 to 0.33.0.
- **FR-008**: `stackra validate --repository` SHALL accept the actions file as strict JSON (`MUST_STAY_JSON`).

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN `apply` runs as the release workflow THE registry SHALL show the tag moved, the deprecation in both
  packument forms and one audit row per write.
- **AC-002**: WHEN `apply` runs from an environment the publisher row does not name THE registry SHALL change nothing.
- **AC-003**: WHEN a tag has moved on from every `from` version THE script SHALL leave it alone.
- **AC-004**: IF the plan has a problem THEN THE script SHALL write nothing and exit 1.
- **AC-005**: WHEN a write is accepted but not visible THE script SHALL exit 1 naming the pending action.
- **AC-006**: THE actions file SHALL name 0.10.0, 0.28.0 and 0.33.1 and move `latest` back to 0.33.0.

## Success Criteria _(mandatory)_

- **SC-001**: `registry-maintain.test.mjs` proves FR-001 to FR-005, FR-007 and AC-003 to AC-006, and fails under each
  of six mutations of the script (no compare-and-set, no token mask, no verify after apply, deprecations before tags,
  scan passing an undeprecated version, a missing exact name not a problem) — verified by: unit
- **SC-002**: `registry-maintain.test.ts` runs the script against the Worker and proves AC-001 to AC-003 — verified by:
  integration
- **SC-003**: `repository-checks.test.ts` proves FR-008 and fails without the row — verified by: unit
- **SC-004**: actionlint and zizmor pass on `release.yml`; a read-only `plan` and `scan` against the live registry pass
  — verified by: manual
- **SC-005**: the owner approves one `apply` and `pnpm view` shows the deprecations and `latest` at 0.33.0 — verified
  by: manual (after merge)

## Compatibility and migration

- Nothing changes for a push to `main` or the existing dispatches.
- After the first `apply`, `pnpm add @stackra/<name>` resolves 0.33.0 until the next release moves `latest` forward.
  A consumer already on 0.33.1 sees the deprecation warning and pins 0.33.0 or takes the next release.
- Entries stay in the file as the record; a re-run is a no-op.

## Risks

- **R-1**: A wrong entry deprecates a good version. Mitigated by review of the file, the plan in the job summary before
  the owner approves, and `message: ""` to undo.
- **R-2**: Moving `latest` while a release is publishing. Mitigated by compare-and-set and the plan running again
  inside the write job; a tag that moved on is left alone.
- **R-3**: The `release` environment's required reviewer is the only human gate; it is the same gate as a publish.

## Out of scope

- `@stackra-pro` versions (its own repository's workflow and publisher row).
- Editing published changelogs (they are generated; the deprecation message carries the correction).
- Running `scan` on a schedule.

## Assumptions

- Stackra packages depend on each other at exact versions (the fixed group, ADR 0177), so an exact-version walk finds
  every ETARGET.
- The registry's catalogue lists every published name of a scope.

## Open questions

None.

## Amendments

None.

## Status history

- 2026-11-26 → Clarified (STA-2863: the partial 0.33.1 and 0.10.0 and container 0.28.0, from a read-only scan of the registry)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md; built in the same branch)
- 2026-11-26 → Implementing (T001 to T009 committed on the branch; the owner's first `apply` waits on merge)
