# Tasks: Playground glass shell, landing gallery and command palette

**Input**: `.agents/specs/sta-422-playground-glass-shell/`

## Phase 1: User Story 1 - A reviewer finds and walks every component page

- [x] T001 [US1] Shell, palette, strip and pager in `apps/playground/src/components/playground-shell/playground-shell.tsx`, `apps/playground/src/components/command-palette/command-palette.tsx`, `apps/playground/src/components/category-nav/category-nav.tsx` and `apps/playground/src/components/page-pager/page-pager.tsx` — covers: FR-001, P-001, EC-02 — route: spec-task
- [x] T002 [US1] Index stage, showcase and gallery in `apps/playground/src/routes/home/home.tsx`, `apps/playground/src/components/hero-art/hero-art.tsx`, `apps/playground/src/components/showcase/showcase.tsx` and `apps/playground/src/components/page-gallery/page-gallery.tsx` — covers: FR-002, EC-01 — route: spec-task
- [x] T003 [US1] Tier in discovery in `apps/playground/src/components/playground-pages/playground-pages.tsx` and `apps/playground/src/enums/page-tier.enum.ts` — covers: FR-003, P-002 — route: spec-task
- [x] T004 [US1] Glass material and fallbacks in `apps/playground/src/styles/app.css`, ADR 0320 in `apps/docs/src/adr/0320-stackra-brand-glass-material-and-the-showcase-stage.mdx` — covers: FR-004, SC-001 — route: spec-task
- [x] T005 [US1] Tests in `apps/playground/src/components/playground-shell/__tests__/playground-shell.test.tsx`, `apps/playground/src/components/command-palette/__tests__/command-palette.test.tsx`, `apps/playground/src/routes/home/__tests__/home.test.tsx`, `apps/playground/src/components/playground-pages/__tests__/playground-pages.test.tsx` and `apps/playground/e2e/__tests__/playground.e2e.test.ts` — covers: FR-001, FR-002, FR-003, FR-004, P-001, P-002, SC-001 — route: tests — deps: T001, T002, T003, T004
