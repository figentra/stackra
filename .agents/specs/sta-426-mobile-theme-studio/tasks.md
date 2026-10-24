# Tasks: The mobile Theme Studio in Settings

**Input**: `.agents/specs/sta-426-mobile-theme-studio/`

## Phase 1: User Story 1 - A person tunes the app's theme on the phone and sees it at once

- [x] T001 [US1] The theme settings store in `apps/mobile/src/stores/theme-settings.store.ts` — covers: FR-002, P-002, EC-01 — route: mobile
- [x] T002 [US1] The studio in `apps/mobile/src/screens/settings-screen.tsx`, applied through the store — covers: FR-001, P-001 — route: mobile — deps: T001
- [x] T003 [US1] Tests in `apps/mobile/src/stores/__tests__/theme-settings.store.test.ts` — covers: FR-001, FR-002, P-001, P-002, EC-01, SC-001 — route: tests — deps: T001
