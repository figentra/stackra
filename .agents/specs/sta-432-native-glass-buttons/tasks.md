# Tasks: Glass quiet buttons on native

**Input**: `.agents/specs/sta-432-native-glass-buttons/`

## Phase 1: User Story 1 - A person sees the quiet native buttons as glass, and solid when they ask for less transparency

- [x] T001 [US1] The material decision in `packages/design-system/ui/src/native/glass/use-glass-material.ts` — covers: FR-002, P-002, EC-02 — route: spec-task
- [x] T002 [US1] The glass look in `packages/design-system/ui/src/native/glass/use-glass-button.tsx`, used by `packages/design-system/ui/src/native/button/button.tsx` and `packages/design-system/ui/src/native/close-button/close-button.tsx` — covers: FR-001, P-001, EC-01 — route: spec-task — deps: T001
- [x] T003 [US1] Tests in `packages/design-system/ui/src/native/glass/__tests__/use-glass-material.test.tsx`, `packages/design-system/ui/src/native/glass/__tests__/use-glass-button.test.tsx` and the Button, IconButton and CloseButton tests — covers: FR-001, FR-002, P-001, P-002, EC-01, EC-02, SC-001 — route: tests — deps: T001, T002
