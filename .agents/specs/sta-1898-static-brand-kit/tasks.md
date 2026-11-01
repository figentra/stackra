# Tasks: The static Worker serves the brand kit images

**Input**: `.agents/specs/sta-1898-static-brand-kit/`

## Phase 1: Serve the brand kit images

- [x] T001 [US1] Pin file `workers/static/brand-pins.yaml`, copy in `workers/static/src/main.ts`, `/brand/*` rule in `workers/static/src/site/render-headers.ts` — covers: FR-001, FR-003, FR-004, P-001 — route: spec-task
- [x] T002 [US1] Token and pull steps in `.github/workflows/runway-cloudflare-workers.yml`, caller in `.github/workflows/deploy-static.yml` — covers: FR-002 — route: spec-task
- [x] T003 [US1] Test in `workers/static/src/site/__tests__/render-headers.test.ts` — covers: P-001 — route: tests — deps: T001
- [x] T004 [US1] Docs: member README and AGENTS, workflows README, ADR 0284 note — covers: FR-001 — route: spec-task
