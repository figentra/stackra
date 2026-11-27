---
description: "Tasks for STA-2878: a full-history secret scan of every public ref and a stale-branch archive plan"
---

# Tasks: a full-history secret scan of every public ref and a stale-branch archive plan

**Input**: Design documents from `.agents/specs/sta-2878-history-secret-scan/`

**Prerequisites**: plan.md, spec.md

## Phase 1: The scan

- [x] T001 `scan` over every ref with the policy and raw passes, value-free rows and refs per finding in `tools/scripts/secrets-history-scan.mjs` — covers: FR-001, FR-002, FR-003, AC-002, AC-003, AC-004, AC-005, P-001, P-002, P-003 — route: spec-task
- [x] T002 the raw pass ignores inline `gitleaks:allow` comments (`--ignore-gitleaks-allow`), the policy pass honours them, in `tools/scripts/secrets-history-scan.mjs` — covers: FR-002, AC-007, P-002 — route: spec-task — deps: T001
- [x] T003 tests: fake gitleaks that rejects the wrong inline-allow flag per pass, a real-gitleaks pull-request-only credential, and a real-gitleaks `gitleaks:allow` credential on a pull request ref in `tools/scripts/__tests__/secrets-history-scan.test.mjs` — covers: FR-001, FR-002, FR-003, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007 — route: tests — deps: T002

## Phase 2: Stale branches

- [x] T004 `branches` and `archive` (verified bundles, manifest, lease-guarded deletion script) in `tools/scripts/secrets-history-scan.mjs` — covers: FR-004, FR-005, AC-008, AC-009, AC-011, P-004, P-005 — route: spec-task
- [x] T005 tests for branch classes, protected branches, bundles and the lease in `tools/scripts/__tests__/secrets-history-scan.test.mjs` — covers: FR-004, FR-005, AC-008, AC-009, AC-010, AC-011 — route: tests — deps: T004

## Phase 3: Polish

- [x] T006 [P] the dated reports, rerun with the inline-allow fix, in `docs/security/history-secret-scan-2026-11-26.md` and `docs/security/branch-archive-plan-2026-11-26.md`; `secrets:scan:history` in `package.json`; a row in `tools/scripts/README.md` — covers: FR-003, FR-004, AC-004, AC-008 — route: steward-docs — deps: T003, T005
