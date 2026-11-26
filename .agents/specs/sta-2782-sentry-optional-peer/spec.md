# Feature Specification: @sentry/vite-plugin is an optional peer of @stackra/vite-plugin

**Feature Branch**: `figentra/sta-2782-sentry-optional-peer`

**Created**: 2026-11-26

**Status**: Implementing <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: feature

**Approver**: leader

**Linear**: STA-2782

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: `@stackra/vite-plugin` listed `@sentry/vite-plugin` in `dependencies`, so every consumer downloaded the Sentry
CLI binary (FSL-1.1-MIT) through `@sentry/vite-plugin → @sentry/bundler-plugins → @sentry/cli → @sentry/cli-<platform>`,
even with Sentry off. Only a member that uploads source maps (the `sourcemaps` option) uses it. The CTO ruled on
2026-11-24 to make it an optional, lazily loaded peer, as `vite-plugin-pwa` already is (STA-2776).

### Sources

- `packages/developer/vite-plugin/package.json` (the dependency before this change)
- `packages/developer/vite-plugin/src/core/functions/sentry-plugin.function.ts`, `pwa-plugin.function.ts`,
  `vite-config.function.ts`
- STA-2782 (CTO ruling, 2026-11-24), STA-2776 (`vite-plugin-pwa` made optional, PR #1055)
- ADR 0184 (telemetry), ADR 0173 (no secret in a tool config), ADR 0022 (test placement)
- FR-001 to FR-005: the PR's diff against `main` and its tests

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/developer/vite-plugin (`package.json`, `sentryPlugin`, `pwaPlugin`, a new internal
  `importOptionalPeer`)
- **Public contract change**: manifest only. `@sentry/vite-plugin` moves from `dependencies` to an optional
  `peerDependencies` entry (and `devDependencies` for the package's own tests). No export, type or option changes.
  `sentryPlugin` is internal; it gains an optional `load` parameter used by tests.
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none. The plugin still reads no secret; the Sentry plugin reads `SENTRY_AUTH_TOKEN` from the
  release job's environment itself.
- **Secrets**: none
- **ADR needed**: no (a dependency placement decision ruled by the CTO on STA-2782)
- **New dependencies**: none (one dependency moves to an optional peer)
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/developer/vite-plugin/README.md`, `packages/developer/vite-plugin/AGENTS.md`, a minor
  changeset for `@stackra/vite-plugin`
- **Lane**: full (a published manifest changes what consumers install)
- **Change risk**: R1 (a member that uploads source maps must now add `@sentry/vite-plugin` itself)

## Glossary _(full lane)_

- **Optional peer**: a `peerDependencies` entry marked `optional` in `peerDependenciesMeta`: the package manager does
  not install it, and a member that uses the feature adds it.
- **Source map upload**: the `sourcemaps` option of `viteConfig`, `{ upload: "sentry", project }`, which adds the Sentry
  Vite plugin to a production build.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A member without Sentry installs no Sentry CLI (Priority: P1)

A team adds `@stackra/vite-plugin` to an app that does not upload source maps. Its install resolves no `@sentry/*`
package, so no Sentry CLI binary is downloaded and no FSL licence enters its tree.

**Why this priority**: every consumer paid for the binary before this change.

**Independent Test**: resolve a consumer of the packed package with and without the change and list the `@sentry/*`
packages in its lockfile.

**Acceptance Scenarios**:

1. **Given** a consumer of the packed `@stackra/vite-plugin`, **When** its dependencies are resolved, **Then** the
   lockfile holds no `@sentry/*` package.
2. **Given** a production build without the `sourcemaps` option, **When** `viteConfig` runs, **Then** it never asks for
   the Sentry plugin.

---

### User Story 2 - A member that uploads source maps is told what to add (Priority: P1)

A team turns on the `sourcemaps` option without adding `@sentry/vite-plugin`. The build stops with one error that names
the package and the command to add it, or to turn the option off.

**Acceptance Scenarios**:

1. **Given** the `sourcemaps` option and no `@sentry/vite-plugin`, **When** the build runs, **Then** it fails with an
   error naming `pnpm add -D @sentry/vite-plugin` and the `sourcemaps` option, with the original error as its cause.
2. **Given** the package installed, **When** the build runs, **Then** the hidden maps are uploaded to the project and
   deleted, as before.

---

### Edge Cases

- **EC-01**: A package missing deeper in the Sentry tree (for example `@sentry/cli`) is the package's own fault: its
  error passes on unchanged, not rewritten as "add @sentry/vite-plugin".
- **EC-02**: Any other import failure (a syntax error) passes on unchanged.
- **EC-03**: Importing `sentryPlugin` does not load `@sentry/vite-plugin`; only calling it does.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE `@stackra/vite-plugin` manifest SHALL list `@sentry/vite-plugin` and `vite-plugin-pwa` as optional
  peers and in `devDependencies`, and never in `dependencies`.
- **FR-002**: THE package source SHALL load `@sentry/vite-plugin` and `vite-plugin-pwa` only through a dynamic import,
  each in its one plugin file, and never through a value import.
- **FR-003**: IF the `sourcemaps` option is on and `@sentry/vite-plugin` is not installed THEN `sentryPlugin` SHALL fail
  with one error that names the package, the command to add it and the option, with the import error as its cause.
- **FR-004**: IF the import fails for any other reason THEN `sentryPlugin` SHALL pass that error on unchanged.
- **FR-005**: WHEN the `sourcemaps` option is off THE `viteConfig` function SHALL not ask for the Sentry plugin.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN a consumer resolves `@stackra/vite-plugin` THE resolved tree SHALL hold no `@sentry/*` package.
- **AC-002**: WHEN the `sourcemaps` option is off THE build SHALL not load `@sentry/vite-plugin`.
- **AC-003**: IF the `sourcemaps` option is on and the peer is missing THEN THE build SHALL fail with one error that
  says what to add.
- **AC-004**: WHEN the peer is installed THE source map upload SHALL behave as before.

## Success Criteria _(mandatory)_

- **SC-001**: `optional-peers.test.ts` proves FR-001 and FR-002 and fails against main's manifest — verified by: unit
- **SC-002**: `sentry-plugin.function.test.ts`, `sentry-plugin-lazy.function.test.ts` and `vite-config.function.test.ts`
  prove FR-003 to FR-005 and AC-002 to AC-004 — verified by: unit
- **SC-003**: a consumer of the packed package resolves no `@sentry/*` package (before: 13 entries, among them
  `@sentry/cli` and its eight platform binaries) — verified by: manual
- **SC-004**: the `@stackra/vite-plugin` tests, typecheck, oxlint and oxfmt pass — verified by: manual

## Compatibility and migration

- A member that uploads source maps adds the package itself: `pnpm add -D @sentry/vite-plugin`. Without it the build
  stops with one error that says so. No member in this repository or the template sets the `sourcemaps` option today.
- Every other member needs no change and installs less.

## Risks

- **R-1**: A release job that turned on source maps relying on the transitive install now fails until the package is
  added; mitigated by the error message and the changeset.

## Out of scope

- Setting the licence exceptions for `@sentry/cli` and `@sentry/cli-linux-x64` back to scope `tool` in
  `tools/policy/licences.json`: that file is not on `main` yet (PR #1043). It follows once #1043 lands.

## Assumptions

- Node reports a missing package as `ERR_MODULE_NOT_FOUND` with the package name quoted in the message.

## Open questions

None.

## Amendments

None.

## Status history

- 2026-11-26 · — → Draft · Claude (STA-2782 session) · created from the branch diff
- 2026-11-26 · Draft → Clarified · Claude (STA-2782 session) · clarifications complete
- 2026-11-26 · Clarified → Planned · Claude (STA-2782 session) · plan.md
- 2026-11-26 · Planned → Tasked · Claude (STA-2782 session) · tasks.md
- 2026-11-26 · Tasked → Implementing · Claude (STA-2782 session) · T001 to T006 committed on the branch
