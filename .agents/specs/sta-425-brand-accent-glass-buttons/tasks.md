# Tasks: A steel-blue brand accent and glass buttons on the web

**Input**: `.agents/specs/sta-425-brand-accent-glass-buttons/`

## Phase 1: User Story 1 - A person sees the brand in the primary action and glass in the quiet ones

- [x] T001 [US1] Steel-blue accent in `packages/design-system/tokens/src/core/constants/stackra-theme.constant.ts` and the brand record `packages/design-system/tokens/assets/data/stackra/brand.json` — covers: FR-001, P-001, EC-01 — route: spec-task
- [x] T002 [US1] Glass button rules in `packages/design-system/tokens/src/core/functions/render-web-css.function.ts`, regenerated `packages/design-system/tokens/assets/public/themes/stackra/web.css` — covers: FR-002, P-002, SC-001 — route: spec-task
- [x] T003 [US1] Tests in `packages/design-system/tokens/src/core/constants/__tests__/stackra-theme.constant.test.ts` and `packages/design-system/tokens/src/core/functions/__tests__/render-web-css.function.test.ts` — covers: FR-001, FR-002, P-001, P-002, SC-001 — route: tests — deps: T001, T002
