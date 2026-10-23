# Tasks: Branded landing and 404 page for the static host

**Input**: `.agents/specs/sta-401-static-landing/`

## Phase 1: User Story 1 - A person who opens the host sees where to go

- [x] T001 [US1] Page and plan in `workers/static/src/site/render-page.ts`, `workers/static/src/site/plan-site.ts` and `workers/static/src/constants/stackra-wordmark-svg.constant.ts` — covers: FR-001, P-001, EC-01 — route: spec-task
- [x] T002 [US1] 404 handling and cache rule in `workers/static/wrangler.jsonc` and `workers/static/src/site/render-headers.ts` — covers: FR-002, P-002, SC-001 — route: spec-task
- [x] T003 [US1] Tests in `workers/static/src/site/__tests__/render-page.test.ts` and `workers/static/src/site/__tests__/render-headers.test.ts` — covers: FR-001, FR-002, P-001, P-002 — route: tests — deps: T001, T002
