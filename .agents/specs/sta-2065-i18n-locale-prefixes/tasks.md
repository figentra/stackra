---
description: "Tasks for STA-2065: #stackra/i18n locale prefixes from I18nConfig"
---

# Tasks: `#stackra/i18n` locale prefixes from I18nConfig

**Input**: Design documents from `.agents/specs/sta-2065-i18n-locale-prefixes/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: Setup

- [ ] T001 Merge origin/main into the branch and confirm the gen tests pass on ci-box before any edit, in `packages/developer/gen/package.json` — covers: SC-003, AC-001 — route: gen

## Phase 2: User Story 1 - The router gets each configured locale's prefix (Priority: P1)

**Goal**: `import { prefixes } from "#stackra/i18n"` gives each configured locale's lowercase URL prefix.

**Independent Test**: emitI18n over IR fixtures with and without an I18nConfig override; the i18n-packages golden fixture.

- [ ] T002 [US1] Test first, then lift the override lookup into a shared function and call it from emitExpoConfig, in `packages/developer/gen/src/core/functions/__tests__/configured-default.function.test.ts`, `packages/developer/gen/src/core/functions/configured-default.function.ts` and `packages/developer/gen/src/core/functions/emit-expo-config.function.ts` — covers: FR-004, P-004, SC-001, AC-002 — route: gen — deps: T001
- [ ] T003 [US1] Test first: prefixes for an en and ar-SA override, prefix strategy, another default locale, no override, en-US lowercased, and the unchanged no-file cases, in `packages/developer/gen/src/core/functions/__tests__/emit-i18n.function.test.ts` — covers: FR-001, FR-002, FR-003, P-001, P-002, P-003, EC-01, EC-02, EC-03, EC-04, EC-05, AC-001, AC-002 — route: tests — deps: T002
- [ ] T004 [US1] Read locales, defaultLocale and urlStrategy through the shared lookup and write prefixes, in `packages/developer/gen/src/core/functions/emit-i18n.function.ts` — covers: FR-001, FR-002, FR-003, P-001, P-002, P-003, AC-001, AC-002 — route: gen — deps: T003
- [ ] T005 [US1] Give the golden customers package an I18nConfig override with en and ar-SA (and an @stackra/i18n stand-in only if the real package does not resolve), refresh and review the expected output, in `packages/developer/gen/__golden__/i18n-packages/input/packages/customers/src/config/i18n.config.ts.golden` and `packages/developer/gen/__golden__/README.md` — covers: SC-002, AC-001 — route: gen — deps: T004

## Phase 3: Polish

- [ ] T006 [P] Update the emitI18n row and the .stackra/gen/i18n.ts row, in `packages/developer/gen/README.md` — covers: SC-001, AC-001, AC-002 — route: steward-docs — deps: T004
- [ ] T007 Run gen test, typecheck, lint and pnpm verify on ci-box, and a changeset for @stackra/gen, in `.changeset/sta-2065-i18n-locale-prefixes.md` — covers: SC-001, SC-002, SC-003, AC-001, AC-002 — route: verify-fix — deps: T005, T006
