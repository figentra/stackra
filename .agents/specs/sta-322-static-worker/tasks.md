# Tasks: Hosted static files Worker at static.stackra.figentra.com

**Input**: `.agents/specs/sta-322-static-worker/`

## Phase 1: User Story 1 - Editors resolve a schema by its `$id`

- [x] T001 [US1] Builder in `workers/static/src/site/plan-site.ts`, `workers/static/src/site/parse-schema.ts` and `workers/static/src/site/render-headers.ts` — covers: FR-001, FR-002, FR-003, P-001, P-002, P-003, EC-01, EC-02 — route: spec-task
- [x] T002 [US1] Release reader in `workers/static/src/site/read-schema-releases.ts` — covers: FR-004, P-004, EC-02 — route: spec-task
- [x] T003 [US1] Tests in `workers/static/src/site/__tests__/plan-site.test.ts`, `workers/static/src/site/__tests__/render-headers.test.ts` and `workers/static/src/site/__tests__/read-schema-releases.test.ts` — covers: FR-001, FR-002, FR-003, FR-004, P-001, P-002, P-003, P-004 — route: tests — deps: T001, T002
- [x] T004 [US1] Member and root wiring in `workers/static/wrangler.jsonc`, `tools/scripts/validate-repository.mjs` and ADR `apps/docs/src/adr/0284-hosted-static-files-one-cloudflare-static-assets-worker.mdx` — covers: SC-001 — route: spec-task — deps: T001

## Phase 2: User Story 2 - CI deploys, and stays green without credentials

- [x] T005 [US2] Workflow `.github/workflows/deploy-static.yml` — covers: FR-005, P-005 — route: spec-task — deps: T004
