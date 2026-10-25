# Tasks: Native output for the @stackra/tokens palette

**Input**: `.agents/specs/sta-455-native-palette/`

## Phase 1: User Story 1 - A native screen paints the theme's own accent steps

- [x] T001 [US1] The palette as `--color-<name>` in both variants in `packages/design-system/tokens/src/core/functions/render-native-css.function.ts`, and the regenerated `packages/design-system/tokens/assets/public/themes/stackra/native.css` — covers: FR-001, P-001, EC-01 — route: package
- [x] T002 [US1] Tests in `packages/design-system/tokens/src/core/functions/__tests__/render-native-css.function.test.ts` — covers: FR-001, FR-002, P-001, P-002, SC-001 — route: tests — deps: T001
