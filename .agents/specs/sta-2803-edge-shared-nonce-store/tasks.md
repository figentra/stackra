---
description: "Tasks for STA-2803: a shared edge nonce store over Cache.add, and secret-store edge signing keys"
---

# Tasks: a shared edge nonce store over `Cache.add`, and secret-store edge signing keys

**Input**: Design documents from `.agents/specs/sta-2803-edge-shared-nonce-store/`

**Prerequisites**: plan.md, spec.md

## Phase 1: Foundational - `Cache.add`

- [x] T001 `add` on the `Cache` port with a rejecting default in `packages/runtime/cache/src/contracts/ports/cache.port.ts` — covers: FR-004, AC-004, P-003 — route: spec-task
- [x] T002 optional `create` on the store types and `add` over it in `packages/runtime/cache/src/core/functions/stored-cache.function.ts`, `packages/runtime/cache/src/core/functions/text-entry-store.function.ts`, `packages/runtime/cache/src/core/drivers/stored-cache.driver.ts`, `packages/runtime/cache/src/core/types/cache-store.type.ts`, `packages/runtime/cache/src/core/types/cache-entry-store.type.ts` and `packages/runtime/cache/src/core/types/cache-operations.type.ts` — covers: FR-005, AC-002, AC-005, P-004 — route: spec-task — deps: T001
- [x] T003 memory `create` (one synchronous check-and-set) in `packages/runtime/cache/src/core/functions/memory-entry-store.function.ts` and `packages/runtime/cache/src/core/drivers/memory-cache.driver.ts` — covers: FR-005, AC-002, P-001 — route: spec-task — deps: T002
- [x] T004 Valkey `create` as one `SET PX NX` in `packages/runtime/cache/src/node/drivers/valkey-cache.driver.ts` — covers: FR-002, FR-005, NFR-001, AC-002 — route: spec-task — deps: T002
- [x] T005 Postgres `create` as one upsert that replaces only a dead row in `packages/runtime/cache/src/node/drivers/postgres-cache.driver.ts` — covers: FR-002, FR-005, NFR-001, AC-002, AC-005 — route: spec-task — deps: T002
- [x] T006 `storage` and `workers` keep the rejecting default, documented in `packages/runtime/cache/src/core/drivers/storage-cache.driver.ts` and `packages/runtime/cache/src/worker/drivers/workers-cache.driver.ts` — covers: FR-006, AC-004 — route: spec-task — deps: T002
- [x] T007 tests: port default, memory, storage, workers, Postgres unit and Valkey on a real server in `packages/runtime/cache/src/node/drivers/__tests__/valkey-cache.driver.int.test.ts`, `packages/runtime/cache/src/core/drivers/__tests__/memory-cache.driver.test.ts`, `packages/runtime/cache/vitest.int.config.ts` and `packages/runtime/cache/package.json` — covers: FR-004, FR-005, FR-006, AC-002, AC-004, AC-005, SC-002 — route: tests — deps: T003, T004, T005, T006
- [x] T008 the dead-row and concurrent-add cases on real Postgres in `packages/data/database/src/node/database/migrations/__tests__/0005-create-cache-tables.migration.int.test.ts` — covers: FR-005, AC-002, AC-005 — route: tests — deps: T005

## Phase 2: User Story 1 - A replay is refused on every instance (Priority: P1)

**Goal**: the `cache` driver of `EdgeNonceStore`, so every instance sharing a cache refuses a replay.

**Independent Test**: two guards over one Postgres cache in `edge-nonce-shared.int.test.ts`.

- [x] T009 [US1] `CacheEdgeNonceStoreDriver` in `packages/runtime/app/src/server/drivers/cache-edge-nonce-store.driver.ts`, `packages/runtime/app/src/contracts/ports/edge-nonce-store.port.ts`, `packages/runtime/app/src/server/services/edge-header.guard.ts` and `packages/runtime/app/package.json` — covers: FR-001, FR-002, NFR-002, AC-001, P-002 — route: spec-task — deps: T002
- [x] T010 [US1] driver names, config and registry types in `packages/runtime/app/src/core/constants/edge-drivers.constant.ts` and `packages/runtime/app/src/core/types/edge-driver-names.type.ts` — covers: FR-010, AC-008, P-006 — route: spec-task — deps: T009
- [x] T011 [US1] tests: the driver, the guard across two instances and fail-closed, real Postgres in `packages/runtime/app/src/server/drivers/__tests__/cache-edge-nonce-store.driver.test.ts`, `packages/runtime/app/src/server/services/__tests__/edge-header.guard.test.ts` and `packages/runtime/app/src/server/__tests__/edge-nonce-shared.int.test.ts` — covers: FR-001, FR-002, FR-003, AC-001, AC-003, SC-001 — route: tests — deps: T009

## Phase 3: User Story 2 - Signing keys read from the secret store (Priority: P2)

**Goal**: the `secrets` driver of `EdgeSigningKeys` and the one parser both key drivers share.

**Independent Test**: `secrets-edge-signing-keys.driver.test.ts` and `edge-signing-keys-boot.test.ts`.

- [x] T012 [US2] `edgeSigningKeysOf`, used by `env`, in `packages/runtime/app/src/server/functions/edge-signing-keys-of.function.ts` and `packages/runtime/app/src/server/drivers/env-edge-signing-keys.driver.ts` — covers: FR-008, AC-006, P-005 — route: spec-task
- [x] T013 [US2] `SecretsEdgeSigningKeysDriver` and `signingKeysSecret` in `packages/runtime/app/src/server/drivers/secrets-edge-signing-keys.driver.ts`, `packages/runtime/app/src/contracts/ports/edge-signing-keys.port.ts`, `packages/runtime/app/src/core/constants/edge-config-schema.constant.ts` and `packages/runtime/app/src/core/schemas/edge-options.schema.ts` — covers: FR-007, FR-009, AC-006, AC-007 — route: spec-task — deps: T012
- [x] T014 [US2] tests: the driver and both boot paths in `packages/runtime/app/src/server/drivers/__tests__/secrets-edge-signing-keys.driver.test.ts` and `packages/runtime/app/src/server/__tests__/edge-signing-keys-boot.test.ts` — covers: FR-007, FR-008, FR-009, AC-006, AC-007 — route: tests — deps: T013

## Phase 4: Polish

- [x] T015 barrel exports and both manifests in `packages/runtime/app/src/server/index.ts`, `packages/runtime/app/stackra.manifest.json` and `workers/edge/stackra.manifest.json` — covers: FR-010, AC-008, P-006 — route: spec-task — deps: T010, T013
- [x] T016 [P] ADR 0437 Enforcement, READMEs and AGENTS.md in `apps/docs/src/docs/adr/0437-the-edge-worker-its-kv-copy-and-the-server-checks.mdx`, `packages/runtime/app/README.md`, `packages/runtime/app/AGENTS.md`, `packages/runtime/cache/README.md` and `packages/runtime/cache/AGENTS.md` — covers: FR-010, AC-008 — route: steward-docs — deps: T015
- [x] T017 [P] changeset for `@stackra/cache` and `@stackra/app` in `.changeset/edge-shared-nonce-store.md` — covers: FR-010, AC-008 — route: steward-changesets — deps: T015
