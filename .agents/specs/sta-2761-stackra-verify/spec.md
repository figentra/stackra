# Feature Specification: stackra/verify, main's gate run on our machines for every PR head

**Feature Branch**: `figentra/sta-2761-stackra-verify-squashed`

**Created**: 2026-11-26

**Status**: Implementing <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: feature

**Approver**: leader

**Linear**: STA-2761

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: GitHub-hosted CI cannot be the merge condition on its own: it runs the PR's own definition of the checks, and
a PR can change that definition. `stackra/verify` is a service on the build box that polls open PR heads, runs main's
Quality Gate (ci.yml, step by step) against the PR's tree in rootless, network-sealed containers, and posts the
`stackra/verify` check run from its own GitHub App. The checks that read the tree ("judges") run main's code only. The
box-1 proofs of #1118 at `35ab9c76b` found two defects: the judge image could not install offline (F1), and a PR's
JavaScript could still run inside a judge through a preload, an inline or stdin script, or an anonymous `node:vm` call
(F2). This spec records the service as built, with both fixed.

### Sources

- `tools/scripts/stackra-verify.mjs` (the service; its header records the CTO's rulings of 2026-11-24, round 5 B and
  rounds 6 to 8) and `tools/scripts/__tests__/stackra-verify.test.mjs`
- `tools/scripts/pr-merge.mjs` (merge conditions 5 and 6, behind `VERIFY_ENFORCED`) and its tests
- `tools/policy/licences.json` (the licence policy, CTO ruling 2026-11-24), `tools/README.md`
- the review history of #1043 and the #1118 proof report at `35ab9c76b` (findings F1 a to c and F2)
- ADR 0166 (CI policy and check matrix), ADR 0502 (spec tiers), ADR 0022 (test placement), ADR 0173 (secrets)

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/developer/repo-checks (one `MUST_STAY_JSON` entry: `tools/policy/licences.json`);
  repository tooling: `tools/scripts/stackra-verify.mjs`, `tools/scripts/pr-merge.mjs`, `tools/policy/licences.json`,
  `tools/scripts/osv-canary.lock.yaml`
- **Public contract change**: none in a package API. pr-merge gains merge conditions 5 (a passing `stackra/verify` on
  the exact head) and 6 (risk:R3 and the owner's approval for a change to what verify checks), both off until the
  go-live PR sets `VERIFY_ENFORCED`.
- **Cross-service events**: none
- **Tenancy and data**: none. The service stores run state and logs on the build box only.
- **Security and privacy**: untrusted PR code runs only as a non-root user in containers with no network (installs go
  through an allowlisting proxy), no socket, no secret and a time limit; judges run main's code only (main's files, main's
  install, the guard first in every Node process); no PII.
- **Secrets**: the verify App's private key, a file on the build box read by the daemon only; no value in the repository
- **ADR needed**: no (implements the CTO's rulings of 2026-11-24 recorded on #1043, under ADR 0166)
- **New dependencies**: none in the workspace; the gate's pinned tools (actionlint, zizmor, osv-scanner, squawk,
  gitleaks) are downloaded by checksum into the store image (THIRD_PARTY_NOTICES.md)
- **Deploy modes**: not applicable (an internal CI service on the build box)
- **Licence tier**: free (MIT, this repo's tooling)
- **UI surfaces**: the `stackra/verify` and `stackra/verify-mobile` check runs on GitHub
- **Docs to update**: the service header in `tools/scripts/stackra-verify.mjs`, `tools/README.md`, `STATE.md`, a patch
  changeset for `@stackra/repo-checks`
- **Lane**: full (new behaviour, security)
- **Change risk**: R3 (it changes what verify checks; the owner's approval label)

## Glossary _(full lane)_

- **Judge**: a gate step that reads the PR's tree as data (lint, format, validate, knip and the rest) and runs main's
  code only.
- **PR step**: a step that must run the PR's code (typecheck, build, service-gen, manifests-match-gen, test), in a
  writable container of its own.
- **Judge image**: main's tree at the job's base, installed offline from the store image, the judges built and main's
  gen run; built with no network.
- **Store image**: main's lockfile fetched into `/store` on the pinned base image, with the gate's pinned tools.
- **Guard**: the code every Node process in a judge loads first (`/in/judge-guard.cjs`); **guarded node**: the
  `/in/bin/node` wrapper that starts the real node with it.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A merge waits for main's gate on the exact head (Priority: P1)

The owner turns verify on. A PR merges only with a passing `stackra/verify` run on its current head, posted by the
verify App; a change to what verify checks also needs risk:R3 and the owner's approval.

**Independent Test**: `pr-merge.test.mjs` with `VERIFY_ENFORCED` on and off; `runJob` with fakes.

**Acceptance Scenarios**:

1. **Given** verify is on and the head has no passing run from the verify App, **When** pr-merge evaluates the PR,
   **Then** condition 5 refuses the merge.

### User Story 2 - A PR's code never runs inside a judge (Priority: P1)

A PR plants code a judge might load: a preload in NODE_OPTIONS or `.npmrc`, an inline or stdin script, a config file
compiled through `node:vm` without a file name. The judge runs main's code; the planted code never runs.

**Independent Test**: the guard fixture: the guarded node and the guard over a tested tree and a judge image tree.

**Acceptance Scenarios**:

1. **Given** `NODE_OPTIONS="--require ./evil.js"`, **When** a judge starts node, **Then** the guard, loaded first,
   refuses the preload and no PR code runs.
2. **Given** `node -e <PR text>` or `node - < evil.mjs` in a judge other than validate, **Then** the guard refuses it.
3. **Given** main's code calling `vm.runInThisContext(<PR text>)` with no file name, **When** code from strings is off,
   **Then** the guard refuses it.

### User Story 3 - The judge image builds offline (Priority: P1)

**Acceptance Scenarios**:

1. **Given** a store image whose `pnpm fetch` ran as root, **When** the judge image installs offline as the judge user,
   **Then** the install finds the registry metadata and succeeds, the rebuild leaves no `.pnpm-store` in the tree, and
   main's gen finds every macro package built.

### Edge Cases

- **EC-01**: A tool that starts node with a clean environment (turbo's strict env, a test's `env: { PATH }`) is still
  guarded: the guarded node puts the guard at the head of NODE_OPTIONS and on its command line, and the inline marker is
  a mounted file, not an environment variable.
- **EC-02**: A fork passes its own execArgv (`--require /in/judge-guard.cjs`): the guard allows itself and any absolute
  file outside the tree or main's in it (vitest's fork pool preload from main's install).
- **EC-03**: Options node applies before any preload (`--run`, the config files, snapshots) are refused by the guarded
  node itself, among the options before the script; a script's own `--run` argument is not.
- **EC-04**: validate's own self-tests start `node -e`: validate alone has the inline marker mounted; code from strings
  stays off there, and the self-test that needs ajv skips itself where it cannot build code from strings.
- **EC-05**: A store image without root's pnpm metadata stops the judge build with a message naming the path.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE service SHALL run main's ci.yml gate steps, one container per step in ci.yml's order, against the
  PR's tree, and post the verdict as the `stackra/verify` check run from its own App, bound to the head SHA.
- **FR-002**: THE judge image's offline install SHALL read a copy of the store image's registry metadata owned by the
  judge user (`--cache-dir /tmp/judge-home/.cache/pnpm`), and every rebuild SHALL use the install's store
  (`--store-dir /store`).
- **FR-003**: THE judge image SHALL build every workspace package main's gen loads (`packages/*/*/src/node/database/macros`)
  with the judges.
- **FR-004**: THE guarded node SHALL preload the guard as CommonJS first (head of NODE_OPTIONS and its command line),
  and refuse `--run`, the config-file and snapshot options before starting node.
- **FR-005**: THE guard SHALL refuse, before any other code runs, a preload or loader that is not an absolute file
  outside the tree or main's in it, `--env-file`, `--expose-internals`, and, unless the step allows inline scripts or
  code from strings, an inline script or a script from stdin.
- **FR-006**: WHERE code from strings is off THE guard SHALL refuse code with no file to check: anonymous `node:vm`
  compiles, `Module._compile` with no path, a `data:` or `blob:` import, a Worker from a string,
  `process.binding("contextify")`, and `module.register` of anything but an absolute file outside the tree.
- **FR-007**: THE gate script SHALL read the PR facts with a reader file in `/in`, never `node -e`.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN verify is enforced and the head has no passing `stackra/verify` run from the verify App THE pr-merge
  check SHALL refuse the merge.
- **AC-002**: WHEN the judge image is built from a store image whose fetch ran as root THE offline install SHALL succeed
  with no network, and the tree SHALL hold no `node_modules/.pnpm-store` after the rebuild.
- **AC-003**: THE judge image SHALL build every macro package main's gen loads before it runs gen.
- **AC-004**: IF NODE_OPTIONS or the command line names a preload or loader in the tested tree that is not main's THEN
  THE guard SHALL refuse it before it runs.
- **AC-005**: IF a judge without the inline marker or code from strings is given `-e`, `--eval`, `-p`, `--print`, `-i` or
  a script from stdin THEN THE guard SHALL refuse it.
- **AC-006**: IF code from strings is off and main's code compiles text with no file THEN THE guard SHALL refuse it.
- **AC-007**: WHEN validate runs main's self-tests in a judge THE guard SHALL let their `node -e` run, with code from
  strings still off.
- **AC-008**: THE gate script SHALL read the PR facts through `/in/facts-reader.cjs`.

## Success Criteria _(mandatory)_

- **SC-001**: `stackra-verify.test.mjs` proves AC-002 to AC-008 ("B judge image", "round 7 M2", "#1118 proof 6" (two
  tests), "judge guard", "kinds", "B runJob"); each fails when its fix is reverted — verified by: unit
- **SC-002**: a real `docker build --network none` of the judge Dockerfile lines on box 2 fails at HEAD with
  `ERR_PNPM_NO_OFFLINE_META` and passes with the fix; the rebuild with HOME on another filesystem leaves
  `node_modules/.pnpm-store` without `--store-dir` and none with it — verified by: manual
- **SC-003**: every `tools/scripts` self-test passes under the new guard as validate runs them (inline marker, code from
  strings off) — verified by: manual
- **SC-004**: `pr-merge.test.mjs` proves AC-001 — verified by: unit

## Compatibility and migration

- Nothing changes until the go-live PR sets `VERIFY_ENFORCED`; until then `stackra/verify` is reported, not required.
- The guard file is now `/in/judge-guard.cjs` (was `.mjs`); a run directory from an older service is rewritten by the
  next run.

## Risks

- **R-1**: A main tool that legitimately preloads a bare specifier or compiles anonymous code in a judge would now be
  refused; the box-1 proof rerun runs every judge on a real PR to find one.
- **R-2**: The guarded node's scan for pre-preload options knows node's options that take a separate value
  (`NODE_VALUED_OPTIONS`); an unknown one followed by `--run` ends the scan early. The guard still refuses every
  preload, inline and stdin script node parsed.

## Out of scope

- Turning verify on (the go-live PR).
- Compiled migrations for migration-lint (STA-2788).

## Assumptions

- The build box runs rootless Docker with overlay2, and the judge's `/in` mounts are read-only.

## Open questions

None.

## Amendments

None.

## Status history

- 2026-11-26 · — → Draft · Claude (STA-2761 session) · created from the branch and the #1118 proofs
- 2026-11-26 · Draft → Clarified · Claude (STA-2761 session) · clarifications complete (the CTO's rulings on #1043)
- 2026-11-26 · Clarified → Planned · Claude (STA-2761 session) · plan.md
- 2026-11-26 · Planned → Tasked · Claude (STA-2761 session) · tasks.md
- 2026-11-26 · Tasked → Implementing · Claude (STA-2761 session) · the service and the F1 and F2 fixes on the branch
