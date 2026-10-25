# Tasks: Runway deploy layer (wave R)

**Input**: `.agents/specs/sta-72-runway-deploy-layer/`

## Phase 1: Spec and tracking

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-72-runway-deploy-layer/` — covers: SC-001 — route: spec-draft
- [x] T002 One Linear issue per deliverable under STA-72, blocked ones naming their blocker; STA-233, STA-155 and STA-15 set to their real state — covers: SC-002 — route: linear — deps: T001 [STA-72]

## Phase 2: Runway files and their check

- [x] T003 [US1] `checkRunwayFiles` and `runwayKindOf` in `tools/scripts/validate-repository.mjs`, wired into `main()` — covers: FR-001, FR-002, FR-003 — route: infra — deps: T001 [STA-598]
- [x] T004 [US1] Runway check cases in `tools/scripts/__tests__/validate-repository.test.mjs` — covers: P-001, P-002, P-003 — route: tests — deps: T003 [STA-598]
- [x] T005 [US1] Root `runway.yaml` and `apps/docs/runway.yaml` — covers: FR-004 — route: infra — deps: T003 [STA-599]

## Phase 3: Reusable workflows

- [x] T006 [US2] `.github/workflows/runway-cloudflare-workers.yml`; `.github/workflows/deploy-static.yml` becomes its caller — covers: FR-005 — route: ci-permissions — deps: T005 [STA-600]
- [x] T007 [US3] `.github/workflows/runway-npm.yml` with the bootstrap, Trivy and signed SBOM; `.github/workflows/release.yml` becomes its caller — covers: FR-006 — route: release — deps: T006 [STA-601]
- [x] T008 [US4] `.github/workflows/runway-mintlify.yml` and its caller `.github/workflows/deploy-docs.yml`; `mint a11y` in `.github/workflows/ci.yml` — covers: FR-007 — route: ci-permissions — deps: T006 [STA-342]

## Phase 4: Hardening

- [x] T009 actionlint, zizmor and OSV-Scanner in `.github/workflows/ci.yml`, pinned in `mise.toml`, policy in `.github/zizmor.yml` — covers: FR-008 — route: ci-permissions — deps: T006 [STA-311]
- [x] T010 `.github/rulesets/release-tags.json` — covers: FR-009 — route: ci-permissions — deps: T001 [STA-602]

## Phase 5: Command and design

- [x] T011 [US5] `tools/scripts/runway.mjs` (`plan`, `deploy`, `promote`), the `runway` script in `package.json` and the `runway-deploy` owner ask in `.agents/hooks/_rules.mjs` — covers: FR-010 — route: infra — deps: T005 [STA-268]
- [x] T012 [US5] `tools/scripts/__tests__/runway.test.mjs` and the guard case in `.agents/hooks/__tests__/guard-bash.test.mjs` — covers: P-010 — route: tests — deps: T011 [STA-268]
- [x] T013 `apps/docs/src/runbooks/runway.mdx`, `apps/docs/src/runbooks/deploys.mdx`, `apps/docs/src/docs.json` and `.github/workflows/README.md` — covers: FR-011, FR-012 — route: steward-docs — deps: T008, T011 [STA-603]

## Phase 6: Testing pass (owner mode: deferred)

- [ ] T014 Run the script tests, the guard tests, actionlint, zizmor and a first run of each workflow in the testing pass — covers: SC-003 — route: tests — deps: T004, T009, T012, T013
