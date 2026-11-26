# Implementation Plan: deprecate known-bad versions and move dist-tags through the release workflow

**Spec**: `.agents/specs/sta-2863-registry-deprecations/spec.md` · **Linear**: STA-2863 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2863-registry-deprecations/spec.md`

## Summary

A reviewed data file lists the deprecations and tag moves. A dependency-free node script plans them against the live
registry (read-only), applies them with one OIDC publish token per package, and verifies by planning again. `release.yml`
gains a `registry_maintenance` dispatch: a read-only plan job, then a write job in the `release` environment that the
owner approves. The runbook and the registry README describe it, and the file names 0.10.0, 0.28.0 and 0.33.1.

## Technical Context

- **Language**: JavaScript (ESM, node 24, no dependencies) for the script; TypeScript for the Worker test; YAML for the
  workflow
- **Members**: root `tools/`, `workers/registry` (test and README), `packages/developer/repo-checks`, `apps/docs`
- **Testing**: `node:test` (root `tools/scripts/__tests__`, run by `pnpm validate`); vitest in `workers/registry`
  and `packages/developer/repo-checks` (ADR 0022)
- **Storage**: none (the registry's D1 is written through its public routes)
- **Runtime target**: GitHub Actions `ubuntu-latest` and node

## Constitution Check

| Law                                   | Result | Note                                                                                   |
| ------------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | the script is a root tool; the Worker test loads it by URL, no package imports it      |
| Secrets (ADR 0009)                    | PASS   | no stored secret; OIDC tokens are masked and kept in memory                            |
| Security                              | PASS   | writes only through the publisher row's workflow, ref and environment                  |
| HTTP and events                       | N/A    | uses the registry's existing routes                                                    |
| Tenancy                               | N/A    | no tenant data                                                                         |
| Delegation                            | PASS   | one session, one branch                                                                |
| Not built yet (ADR 0011)              | PASS   | removes "a workflow for deprecations and dist-tag moves" from the runbook's not-built  |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/` beside each changed file                                         |
| Versions and catalogs                 | PASS   | no dependency added; actions pinned by SHA as elsewhere                                |
| Deploy modes (ADR 0076)               | N/A    | registry operation only                                                                |
| Licence tier (ADR 0077)               | PASS   | free                                                                                   |
| Docs and ADRs                         | PASS   | runbook, README, changeset; implements ADR 0453 decisions 6 and 7, ADR 0177 decision 6 |

## Deploy modes

| Mode       | Behaviour                                   |
| ---------- | ------------------------------------------- |
| SaaS       | same: the registry is the one npm source    |
| On-prem    | same: consumers read the same registry      |
| Air-gapped | same: a mirror copies the deprecated fields |

## Correctness properties

- **P-001**: for every actions file, `parseActions` either returns it or throws naming the first bad entry and field — Validates: FR-001
- **P-002**: `plan` writes nothing, for every registry state — Validates: FR-002
- **P-003**: for every tag entry and registry state, a move is planned only when the tag's current version is in `from` — Validates: FR-003
- **P-004**: `apply` exits 0 only when a fresh plan after the writes is empty — Validates: FR-004
- **P-005**: no token value appears in any output line except its `::add-mask::` line, which comes first — Validates: FR-004
- **P-006**: `scan` exits 0 only when every uninstallable version is deprecated or planned — Validates: FR-005
- **P-007**: for every `release.yml` run, the `registry-maintenance` job (the only one with `id-token: write` on that path) runs only when `registry_maintenance` is `apply` and the ref is `refs/heads/main`, and `gate`, `release` and `prerelease` run only when it is empty or `none` — Validates: FR-006
- **P-008**: for every version the actions file deprecates, the registry plan against the live registry has no problem, and every uninstallable `@stackra` version is deprecated or planned — Validates: FR-007
- **P-009**: `checkJsonConfigs` returns no finding for `tools/release/registry-actions.json` — Validates: FR-008

## Architecture overview

`registry-maintain.mjs` reads the file, expands `@scope/*` through the registry's paged catalogue, and compares each
entry with the packument (`versions[v].deprecated`, `dist-tags`). `apply` groups the planned actions by package,
exchanges the job's ID token (audience `npm:<host>`) for a publish token bound to that package, `PUT`s each tag and then
one deprecate body for the package, and plans again with a fresh reader. `release.yml` runs `plan` (or `scan`) in a job
with `contents: read` only, then, for `apply` on `main`, the same script in a job with `environment: release` and
`id-token: write`.

## Components and responsibilities

- `tools/release/registry-actions.json`: the reviewed list (data only).
- `tools/scripts/registry-maintain.mjs`: `parseActions`, `registryReader`, `plan`, `publishToken`, `applyActions`,
  `uninstallable`, `parseArgs`, `run`.
- `.github/workflows/release.yml`: the input, the concurrency group, the guards on `gate`, `release` and `prerelease`,
  and the `registry-plan` and `registry-maintenance` jobs.
- `MUST_STAY_JSON` (`packages/developer/repo-checks`): the row for the actions file.

## Files and folders

```text
.github/workflows/release.yml
.changeset/registry-actions-stay-json.md
apps/docs/src/docs/runbooks/release.mdx
packages/developer/repo-checks/src/node/constants/must-stay-json.constant.ts
packages/developer/repo-checks/src/node/functions/__tests__/repository-checks.test.ts
tools/release/registry-actions.json
tools/scripts/registry-maintain.mjs
tools/scripts/__tests__/registry-maintain.test.mjs
workers/registry/README.md
workers/registry/src/publish/__tests__/registry-maintain.test.ts
```

- `.github/workflows/release.yml`
- `tools/release/registry-actions.json`
- `tools/scripts/registry-maintain.mjs`
- `tools/scripts/__tests__/registry-maintain.test.mjs`
- `workers/registry/src/publish/__tests__/registry-maintain.test.ts`
- `packages/developer/repo-checks/src/node/constants/must-stay-json.constant.ts`
- `packages/developer/repo-checks/src/node/functions/__tests__/repository-checks.test.ts`
- `apps/docs/src/docs/runbooks/release.mdx`, `workers/registry/README.md`, `.changeset/registry-actions-stay-json.md`

## Data models and migrations

none

## Contracts

- `release.yml` `workflow_dispatch` input `registry_maintenance`: `none` (default), `plan`, `scan`, `apply`.
- Actions file: `{ deprecate: [{ packages, version, message, issue, reason }], distTags: [{ packages, tag, from, to,
issue, reason }] }`.
- Script CLI: `registry-maintain.mjs <plan|apply|scan> [--file <path>] [--registry <https url ending in />]`; exit 0,
  1 (invalid file, registry failure, problem, pending or undeprecated) or 2 (bad arguments).
- Registry routes used (unchanged): `GET /@scope%2fname`, `GET /-/stackra/v1/catalogue`,
  `POST /-/npm/v1/oidc/token/exchange/package/@scope%2fname`, `PUT /-/package/@scope%2fname/dist-tags/<tag>`,
  `PUT /@scope%2fname` (no attachment).

## Error handling

A registry refusal stops the run with the route and the registry's error text, never a token. Transient failures are
retried four times with backoff and a 90 s bound per call. A file problem names the entry and field. Re-running after a
partial `apply` skips what is already in place.

## Security and tenancy

Only the publisher row's workflow (`release.yml`, `refs/heads/main`, `release`) gets a publish token; the owner
approves each `apply`. The plan job has no `id-token` permission. Tokens are masked before any output, kept in memory
and never written to a file or the step summary.

## Testing strategy

- AC-001, AC-002, AC-003: `registry-maintain.test.ts` (the Worker in memory with node:sqlite D1).
- AC-003 to AC-006, FR-001 to FR-005: `registry-maintain.test.mjs` (a fake registry with the Worker's rules).
- FR-008: `repository-checks.test.ts`.
- Mutation checks: six script mutations and the removal of the `MUST_STAY_JSON` row each fail a test.
- actionlint and zizmor on the workflow; a read-only `plan` and `scan` against the live registry.

## Rollout

Merge, then the owner dispatches `plan` (no approval), reads it, dispatches `apply` and approves `release`. Check with
`pnpm view`. A patch changeset for `@stackra/repo-checks` rides the next release.

## Delegation and risk plan

One session, one branch. The first `apply` is the owner's (approval of `release`).

## ADRs

ADR 0453 decisions 6 and 7, ADR 0177 decision 6, ADR 0468, ADR 0013: all Accepted.

## Docs

`apps/docs/src/docs/runbooks/release.mdx`, `workers/registry/README.md`, `.changeset/registry-actions-stay-json.md`.

## Complexity tracking

none
