---
description: "Tasks for STA-2055: gen binds Menu, Shortcut, Store, Bridge and ExtensionPoint; a config override keeps its base's key"
---

# Tasks: gen binds Menu, Shortcut, Store, Bridge and ExtensionPoint; a config override keeps its base's key

**Input**: Design documents from `.agents/specs/sta-2055-wiring-kind-bindings/`

**Prerequisites**: plan.md, spec.md

One pull request: T001 to T010.

## Phase 1: Foundational

- [ ] T001 [P] Test first: `BINDING_KINDS` is frozen, unique, snake_case and holds the codes menu, shortcut, store, bridge and extension_point in `packages/developer/gen/src/core/constants/__tests__/binding-kinds.constant.test.ts` — covers: FR-001, P-001, AC-005 — route: tests
- [ ] T002 Add the five codes and update the file contract (the per-kind rows, the extension point's owner injection) in `packages/developer/gen/src/core/constants/binding-kinds.constant.ts` — covers: FR-001, FR-004, P-001, AC-001 — route: gen — deps: T001
- [ ] T003 [P] Add the codes shortcut and extension_point, and assert them in the existing test, in `packages/foundation/container/src/core/constants/binding-kinds.constant.ts` and `packages/foundation/container/src/core/constants/__tests__/binding-kinds.constant.test.ts` — covers: FR-008, P-004, AC-005 — route: package

## Phase 2: User Story 1 - The five kinds are bindings (Priority: P1)

**Goal**: one binding row per class of the five kinds, a Bridge request-scoped by default.

**Independent Test**: `emitWiring` over `COMMERCE_IR` plus one class of each kind.

- [ ] T004 [US1] Test first: the five rows with their tokens, a Bridge's `Lifetime.Request`, an explicit `@Lifetime` winning, a Store row without a lifetime in `packages/developer/gen/src/core/functions/__tests__/emit-wiring.function.test.ts` — covers: FR-001, FR-002, FR-003, P-001, P-002, AC-001, AC-002 — route: tests — deps: T002
- [ ] T005 [US1] Kind lifetime fallback (`KIND_LIFETIMES`, bridge → request) in the binding walk of `packages/developer/gen/src/core/functions/emit-wiring.function.ts` — covers: FR-002, FR-003, P-002, AC-002 — route: gen — deps: T004

## Phase 3: User Story 2 - An owner that injects its extension point resolves (Priority: P1)

**Goal**: loyalty-kit's `AccountService` resolves from its test container.

**Independent Test**: `createTestingModule(LoyaltyKitModule).useDrivers("memory")`, then `get(AccountService)`.

- [ ] T006 [US2] Test: resolve `AccountService` from the test container (overriding only the tokens that need a running request) and assert its point is a `LoyaltyKitExtensionPoint` in `packages/commerce/loyalty-kit/src/node/services/__tests__/account.service.test.ts` — covers: FR-004, P-001, AC-003 — route: tests — deps: T002

## Phase 4: User Story 3 - A config override keeps its base's key (Priority: P1)

**Goal**: one config row per token; the override keyed and selected with its base's key.

**Independent Test**: `emitWiring` over a host IR overriding the kit's `LoyaltyKitConfig`.

- [ ] T007 [US3] Test first: one `key: "loyalty_kit"` row providing the base with `override:`, no `web.loyalty_kit` row, and a selector on `config:loyalty_kit.<field>` in `packages/developer/gen/src/core/functions/__tests__/emit-wiring.function.test.ts` — covers: FR-005, FR-006, FR-007, P-003, AC-004 — route: tests — deps: T005
- [ ] T008 [US3] `configKeyFor` (base manifest `config` entry, else `configKeyOf(base.name, memberOf(base.from))`), used by the config walk and the selector walk, with `memberOf` moved above them, in `packages/developer/gen/src/core/functions/emit-wiring.function.ts` — covers: FR-005, FR-006, FR-007, P-003, AC-004 — route: gen — deps: T007

## Phase 5: Polish

- [ ] T009 [P] Amendment note on decision 16's Extension point row (binding: yes) in `apps/docs/src/docs/adr/0294-programming-model-v3-grammar-folders-identities-and-naming.mdx`, the binding-kind note in `packages/developer/gen/AGENTS.md`, and a patch changeset in `.changeset/wiring-kind-bindings.md` — covers: FR-009, SC-003, AC-005 — route: steward-docs — deps: T008
- [ ] T010 On ci-box: gen, then typecheck and test of gen (golden included), container, loyalty-kit, platform and peripherals; record the box log lines on the issue, using `packages/developer/gen/src/node/__tests__/golden.test.ts` — covers: SC-001, SC-002, SC-003, AC-001, AC-003, AC-004 — route: verify-fix — deps: T003, T006, T008, T009
