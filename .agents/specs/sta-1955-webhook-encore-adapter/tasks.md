---
description: "Tasks for STA-1955: the inbound webhook route is exposed through Encore api.raw adapters"
---

# Tasks: the inbound webhook route is exposed through Encore `api.raw` adapters

**Input**: Design documents from `.agents/specs/sta-1955-webhook-encore-adapter/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: User Story 2 - A provider's own Authorization header is not refused (Priority: P1)

**Goal**: a call can read no credential when its adapter says so.

**Independent Test**: `serveGuardedCall` on a raw call with a provider JWT in `Authorization`.

- [x] T001 [US2] Test first: a raw call its adapter states `credentials: "ignore"` for is never verified, runs anonymous and hands the header on in `packages/runtime/app/src/server/functions/__tests__/serve-guarded-call.function.test.ts` — covers: FR-005, P-005, EC-02, EC-03, AC-002 — route: tests
- [x] T002 [US2] Add `credentials?: "ignore"` to `packages/runtime/app/src/server/types/guarded-call-options.type.ts` and honour it in `packages/runtime/app/src/server/functions/serve-guarded-call.function.ts` — covers: FR-005, P-005, EC-02, EC-03, AC-002 — route: package — deps: T001

## Phase 2: User Story 1 and 3 - Gen writes the webhook adapters (Priority: P1)

**Goal**: two raw adapters per webhook Integration, never a wildcard.

**Independent Test**: `emitEncoreApi` on an IR with own and hosted webhook Integrations.

- [x] T003 [US1] Test first: two adapters per Integration, own and hosted; no wildcard route; nothing without webhooks in `packages/developer/gen/src/core/functions/__tests__/emit-encore-api.function.test.ts` — covers: FR-001, FR-002, FR-003, FR-004, P-001, P-002, P-003, P-004, AC-001, AC-003, AC-004 — route: tests — deps: T002
- [x] T004 [US1] Write the adapters from `webhookIntegrations(ir)` in `packages/developer/gen/src/core/functions/emit-encore-api.function.ts`, and say who writes which adapter in the file contracts of `packages/developer/gen/src/core/functions/emit-encore-inbox.function.ts` and `packages/developer/gen/src/core/functions/emit-webhooks.function.ts` — covers: FR-001, FR-002, FR-003, FR-004, P-001, P-002, P-003, P-004, EC-01, AC-001, AC-003, AC-004 — route: package — deps: T003
- [x] T005 [US2] Test first, then accept and pass `credentials` in the generated `answerCall` in `packages/developer/gen/src/core/functions/emit-encore-http.function.ts` (test: `emit-encore-http.function.test.ts`; every generated http.ts golden under `packages/developer/gen/__golden__/` gains the line) — covers: FR-006, P-006, EC-04, AC-002 — route: package — deps: T004

## Phase 3: End to end through gen

- [x] T006 [US1] Add the `webhook-route` golden fixture under `packages/developer/gen/__golden__/webhook-route/` and register it in `packages/developer/gen/src/node/__tests__/golden.test.ts` — covers: FR-001, FR-002, FR-006, AC-001 — route: tests — deps: T005

## Phase 4: Polish

- [x] T007 Document the webhook adapters and the fixture in `packages/developer/gen/README.md`, `packages/developer/gen/__golden__/README.md` and `.changeset/webhook-route-encore-adapters.md` — covers: SC-001, SC-002, SC-003, SC-004, AC-001 — route: steward-docs — deps: T006
- [ ] T008 Run the `@stackra/gen` and `@stackra/app` tests, typecheck, oxlint and oxfmt, then `pnpm verify`, in `packages/developer/gen/package.json` — covers: SC-001, SC-002, SC-003, SC-004, SC-005, AC-001, AC-002, AC-003, AC-004 — route: verify-fix — deps: T007
- [ ] T009 Verify the provider signature (and the timestamp or replay window) on the raw body before any parse in every `/webhooks/*` raw handler, refuse with a coded 401, refuse `api.raw` outside `/webhooks/*` in gen, and add unsigned and bad-signature tests, in `packages/developer/gen/src/core/functions/emit-encore-api.function.ts` — covers: SC-006, AC-001 — route: tests — deps: T008
