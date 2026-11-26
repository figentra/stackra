---
description: "Tasks for STA-2782: @sentry/vite-plugin is an optional peer of @stackra/vite-plugin"
---

# Tasks: @sentry/vite-plugin is an optional peer of @stackra/vite-plugin

**Input**: Design documents from `.agents/specs/sta-2782-sentry-optional-peer/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: User Story 2 - A member that uploads source maps is told what to add (Priority: P1)

**Goal**: one error that names the peer; every other failure passes on.

**Independent Test**: `sentryPlugin` with a loader that fails as a missing package does.

- [x] T001 [US2] Test first: peer missing, a package missing deeper in its tree, another import failure in `packages/developer/vite-plugin/src/core/functions/__tests__/sentry-plugin.function.test.ts` — covers: FR-003, FR-004, P-003, EC-01, EC-02, AC-003 — route: tests
- [x] T002 [US2] Add `importOptionalPeer` in `packages/developer/vite-plugin/src/core/functions/import-optional-peer.function.ts` and load the peer through it in `packages/developer/vite-plugin/src/core/functions/sentry-plugin.function.ts` and `packages/developer/vite-plugin/src/core/functions/pwa-plugin.function.ts` — covers: FR-003, FR-004, P-003, AC-003, AC-004 — route: package — deps: T001

## Phase 2: User Story 1 - A member without Sentry installs no Sentry CLI (Priority: P1)

**Goal**: the manifest stops pulling the Sentry tree into consumers.

**Independent Test**: the manifest test and a packed-consumer resolution.

- [x] T003 [US1] Test first: Sentry off never asks for the plugin and importing does not load it in `packages/developer/vite-plugin/src/core/functions/__tests__/vite-config.function.test.ts` and `packages/developer/vite-plugin/src/core/functions/__tests__/sentry-plugin-lazy.function.test.ts` — covers: FR-005, P-004, EC-03, AC-002 — route: tests — deps: T002
- [x] T004 [US1] Test first: both optional peers' manifest placement and lazy loading in `packages/developer/vite-plugin/src/core/__tests__/optional-peers.test.ts` — covers: FR-001, FR-002, P-001, P-002, AC-001 — route: tests
- [x] T005 [US1] Move `@sentry/vite-plugin` to an optional peer and a devDependency in `packages/developer/vite-plugin/package.json` and refresh `pnpm-lock.yaml` — covers: FR-001, P-001, AC-001 — route: package — deps: T004

## Phase 3: Polish

- [x] T006 Document the optional peer in `packages/developer/vite-plugin/README.md`, `packages/developer/vite-plugin/AGENTS.md` and `.changeset/vite-plugin-sentry-optional-peer.md` — covers: SC-001, SC-002, AC-003 — route: steward-docs — deps: T005
- [ ] T007 Run the `@stackra/vite-plugin` tests, typecheck, oxlint and oxfmt, then `pnpm verify`, in `packages/developer/vite-plugin/package.json` — covers: SC-001, SC-002, SC-003, SC-004, AC-001, AC-002, AC-003, AC-004 — route: verify-fix — deps: T006
