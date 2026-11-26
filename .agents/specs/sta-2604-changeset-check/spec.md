# Feature Specification: a changed published package cannot merge without a changeset

**Feature Branch**: `figentra/sta-2604-changeset-check`

**Created**: 2026-11-26

**Status**: Implementing <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: small

**Approver**: leader

**Linear**: STA-2604

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: Linear STA-2604 (readiness batch 7, item 7.2: "chain changeset:status into verify, one changeset per changed
published package"). ADR 0013's Enforcement listed "Planned: chain `pnpm changeset:status` into `pnpm verify`", and the
release runbook's rules table said "Script live; not in `verify`". Nothing in `pnpm verify` or the Quality Gate checked
that a changed published member carried a changeset, so a package's code could change while its version and changelog
did not, part of what let 0.33.0 and the partial 0.33.1 out.

### Sources

- `package.json` (`verify`, `verify:affected`, `changeset:status` before this change), `.changeset/config.json`
  (`baseBranch`, `ignore`, the `fixed` group), `pnpm-workspace.yaml` (`catalog`, `catalogs`)
- `apps/docs/src/docs/adr/0013-versioning-and-release.mdx` (Enforcement), ADR 0177 decision PK4, ADR 0502 (tiers),
  `apps/docs/src/docs/runbooks/release.mdx` (rules table: "Script live; not in `verify`")
- stackra#766 and #770 (one changeset for another package let a change ship with no note); STA-2043; PR 1128's review
  notes (version-branch prefix match, empty-changeset waiver, catalog bumps)
- FR-001 to FR-007: `tools/scripts/changeset-check.mjs` and its tests on this branch, the PR 1128 diff against `main`
- Commands: `changeset status --since=main` and `node tools/scripts/changeset-check.mjs` on box 2
  (`/work/stackra-b2/wt/sta-2604.proof2.sh`)

## Problem

`changeset status` alone is not the check the rule needs: it passes when any changeset is pending, so one changeset
for package A let a change to package B merge with no note (stackra#766, #770). It also does not see a catalog bump in
`pnpm-workspace.yaml`, which changes the published manifest of every member that ships the entry.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/developer/flow-preset (the docs-changesets-steward agent text only); repository
  tooling `tools/scripts/changeset-check.mjs` (not a published member)
- **Public contract change**: none. A new root script `pnpm changeset:check`, chained into `pnpm verify`,
  `pnpm verify:affected` and the Quality Gate.
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none; the version-branch skip is limited to `changeset-release/<baseBranch>` from this
  repository so a fork cannot use the branch name to pass
- **Secrets**: none
- **ADR needed**: no (implements ADR 0013's Enforcement line as written; ADR 0177 PK4, a changeset is required)
- **New dependencies**: none (`yaml` is already in the default catalog and a root dependency)
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `apps/docs/src/docs/runbooks/release.mdx`, `apps/docs/src/docs/runbooks/ci.mdx`,
  `apps/docs/src/docs/guides/definition-of-done.mdx`, `apps/docs/src/docs/adr/0013-versioning-and-release.mdx`
  (Enforcement), `.changeset/README.md`, `tools/scripts/README.md`, the docs-changesets-steward agent, a patch
  changeset for `@stackra/flow-preset`
- **Lane**: lite
- **Change risk**: R1 (a pull request that changes a published member now needs a changeset to pass the gate)

## Requirements

### Functional Requirements

- **FR-001**: THE check SHALL map every file changed since the base (committed, uncommitted and untracked) to the
  deepest workspace member that holds it, and count only members that are not `private` and not in the changesets
  `ignore` list.
- **FR-002**: THE check SHALL NOT count tests (`__tests__/`, `__fixtures__/`, `*.test.*`, `*.spec.*`, a `test/`,
  `tests/` or `e2e/` tier at the member root) or the generated `CHANGELOG.md`; the same folder names inside `src/` are
  published source and count.
- **FR-003**: WHEN a `pnpm-workspace.yaml` catalog entry's version differs from the base THE check SHALL count every
  published member that ships the entry as a `dependencies`, `peerDependencies` or `optionalDependencies` spec of
  `catalog:`, `catalog:default` or `catalog:<name>`; a `devDependencies` entry does not count.
- **FR-004**: IF a counted member is not named by a changeset the change adds or edits THEN THE check SHALL exit 1 and
  name the member and up to three of its changed files.
- **FR-005**: THE check SHALL let an empty changeset with a written reason waive the change only when no other
  changeset in it names a package, print the members it waived, and fail an empty changeset with no reason.
- **FR-006**: THE check SHALL skip only `changeset-release/<baseBranch>`, and in a pull request only when its head
  repository is the base repository.
- **FR-007**: THE root `verify` and `verify:affected` scripts and the Quality Gate SHALL run the check.

## Acceptance criteria

- **AC-001**: WHEN a published member changes and no changeset names it THE check SHALL exit 1 naming the member.
- **AC-002**: WHEN the only changeset names another member THE check SHALL still fail for the unnamed one.
- **AC-003**: WHEN a catalog entry a published member ships changes THE check SHALL require that member's changeset.
- **AC-004**: IF an empty changeset sits beside one that names packages THEN THE check SHALL waive nothing and say to
  name the remaining members with `none`.
- **AC-005**: WHERE the head branch is `changeset-release/<baseBranch>` from this repository THE check SHALL skip.
- **AC-006**: IF the head branch is any other `changeset-release/*` branch or comes from a fork THEN THE check SHALL run.
- **AC-007**: THE `pnpm verify` script and the Quality Gate SHALL run `changeset-check.mjs`.

## Success Criteria

- **SC-001**: `tools/scripts/__tests__/changeset-check.test.mjs` proves AC-001 to AC-006 on throwaway git repositories,
  and each of the waiver, catalog and version-branch tests fails with its behaviour reverted — verified by: unit
- **SC-002**: on box 2, a real `changeset status --since=main` passes the stackra#766 shape while `changeset:check`
  fails it — verified by: manual

## Design

### Architecture overview

One node script, `tools/scripts/changeset-check.mjs`, reads git and the working tree, computes the changed published
members (files plus catalog entries), reads the changesets the change adds or edits, and exits 0, 1 or 2.

### Components and responsibilities

`parseChangeset`, `workspaceDirs`, `publishedMembers`, `countsAsChange`, `changedCatalogEntries`, `catalogTouches`,
`check` (pure decision), `resolveBase`, `pullRequestRepos` and `run` (git, files and messages).

### Files and folders

```text
tools/scripts/
├── changeset-check.mjs                    (new)
└── __tests__/changeset-check.test.mjs     (new)
.agents/specs/sta-2604-changeset-check/
└── spec.md                                (new)
.changeset/
└── changeset-check-in-verify.md           (new)
```

Changed: root `package.json`, `.github/workflows/ci.yml`, `.github/workflows/testbed-fallback.yml`, and the docs and
agent files listed in Impact and the tasks.

### Data models and migrations

None.

### Contracts

`pnpm changeset:check [--base <ref>]`; exit 0 covered or skipped, 1 missing or invalid changeset, 2 usage or an
unresolvable explicit base. The module's exports, for its tests:

```js
export function parseChangeset(text: string): { releases: { name: string; type: string }[]; summary: string } | { error: string };
export function workspaceDirs(root: string, globs: string[]): string[];
export function publishedMembers(root: string, config: { ignore?: string[] }): { name: string; dir: string; manifest: object }[];
export function countsAsChange(rel: string, patterns?: string[]): boolean;
export function changedCatalogEntries(before: unknown, after: unknown): Map<string, Set<string>>;
export function catalogTouches(members: { name: string; manifest?: object }[], changed: Map<string, Set<string>>): Map<string, string[]>;
export function check(input: { changed: string[]; members: { name: string; dir: string }[]; changesets: { file: string; text: string }[]; changedFilePatterns?: string[]; catalogTouched?: Map<string, string[]> }): { ok: boolean; missing: { name: string; files: string[] }[]; invalid: string[]; waivedBy: string[]; waived: string[]; ignoredWaivers: string[]; covered: string[] };
export function resolveBase(root: string, explicit: string | undefined, baseBranch: string): { sha: string } | { skip: string } | { fail: string };
export function pullRequestRepos(eventPath?: string): { headRepo?: string; baseRepo?: string } | undefined;
export function run(root: string, opts?: { base?: string; headRef?: string; pullRequest?: { headRepo?: string; baseRepo?: string } }): number;
```

### Error handling

An explicit base that does not resolve exits 2; with no explicit base and no `origin/<baseBranch>` or `<baseBranch>`
(a shallow checkout) it warns and passes; a git failure exits 2.

### Security and tenancy

Reads only git and files in the checkout; writes nothing. The version-branch skip needs the exact branch and, in a pull
request, the same head and base repository (`GITHUB_EVENT_PATH`).

### Testing strategy

node:test on throwaway repositories under the OS temp directory: each rule above, the CLI's exit codes, and the
`GITHUB_EVENT_PATH` fork case. Revert checks for the waiver, catalog and version-branch rules.

### Rollout

The Quality Gate runs it on every pull request from the merge; `pnpm verify` runs it against the merge base with
`origin/main`. A patch changeset for `@stackra/flow-preset` (the steward agent's instructions).

## Tasks

- [x] T001 The check and its tests in `tools/scripts/changeset-check.mjs` and `tools/scripts/__tests__/changeset-check.test.mjs` — covers: FR-001, FR-002, FR-004, AC-001, AC-002
- [x] T002 Catalog bumps count for the members that ship the entry in `tools/scripts/changeset-check.mjs` — covers: FR-003, AC-003
- [x] T003 An empty changeset waives only alone, and prints what it waived, in `tools/scripts/changeset-check.mjs` — covers: FR-005, AC-004
- [x] T004 Skip only `changeset-release/<baseBranch>` from this repository in `tools/scripts/changeset-check.mjs` — covers: FR-006, AC-005, AC-006
- [x] T005 Chain it into `package.json` `verify` / `verify:affected`, `.github/workflows/ci.yml` and `.github/workflows/testbed-fallback.yml` (full history for the merge base) — covers: FR-007, AC-007
- [x] T006 Docs in `apps/docs/src/docs/runbooks/release.mdx`, `apps/docs/src/docs/runbooks/ci.mdx`, `apps/docs/src/docs/guides/definition-of-done.mdx`, `apps/docs/src/docs/adr/0013-versioning-and-release.mdx`, `.changeset/README.md` and `tools/scripts/README.md` — covers: SC-001, AC-007
- [x] T007 The steward agent in `packages/developer/flow-preset/preset/agents/docs-changesets-steward.md`, adopted with `fflow update` into `.agents/agents/docs-changesets-steward.md`, `.claude/agents/docs-changesets-steward.md`, `.opencode/agents/docs-changesets-steward.md` and `.flow/lock.json`, with `.changeset/changeset-check-in-verify.md` — covers: AC-004, AC-007

## Out of scope

- Checking the bump level against the diff (a changeset's `patch` for a removed export).
- Root files that shape every member's build (`tsconfig` bases, turbo config).

## Assumptions

- The Quality Gate checks out the pull request's merge commit, so `HEAD~1` is the base branch tip.

## Amendments

- A-001 · 2026-11-26 · review notes on PR 1128: the version-branch skip became an exact branch and same-repository
  match, an empty changeset waives only when it is the change's only kind of note, and catalog bumps count.

## Status history

- 2026-11-26 · — → Draft · Claude (STA-2604 session) · created from STA-2604 and the PR diff
- 2026-11-26 · Draft → Implementing · Claude (STA-2604 session) · small tier, no approval stop (ADR 0502); T001 to T007 on the branch
