---
description: "Tasks for STA-2761: stackra/verify, main's gate run on our machines for every PR head"
---

# Tasks: stackra/verify, main's gate run on our machines for every PR head

**Input**: Design documents from `.agents/specs/sta-2761-stackra-verify/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: The service and the merge condition

- [x] T001 The daemon, the gate steps from main's ci.yml, the containers and the check run in `tools/scripts/stackra-verify.mjs` with `tools/scripts/__tests__/stackra-verify.test.mjs`, the licence policy `tools/policy/licences.json`, the pinned tools' notices in `THIRD_PARTY_NOTICES.md`, `tools/README.md` and `STATE.md` — covers: FR-001, AC-001 — route: tests
- [x] T002 Merge conditions 5 and 6 behind `VERIFY_ENFORCED` in `tools/scripts/pr-merge.mjs` with `tools/scripts/__tests__/pr-merge.test.mjs` — covers: FR-001, AC-001 — route: tests

## Phase 2: User Story 3 - The judge image builds offline (F1)

- [x] T003 Test first, then copy root's pnpm metadata for the judge user and install with `--cache-dir` in `tools/scripts/stackra-verify.mjs` (`judgeDockerfile`) — covers: FR-002, AC-002 — route: tests — deps: T001
- [x] T004 Test first, then name the install's store (the --store-dir flag) on every rebuild (`REBUILD_COMMAND`) in `tools/scripts/stackra-verify.mjs` — covers: FR-002, AC-002 — route: tests — deps: T001
- [x] T005 Test first, then build every macro package main's gen loads in `tools/scripts/stackra-verify.mjs` (`GEN_MACRO_PACKAGES`) — covers: FR-003, AC-003 — route: tests — deps: T001

## Phase 3: User Story 2 - A PR's code never runs inside a judge (F2)

- [x] T006 Test first (`#1118 proof 6` tests), then the guarded node preloads the CommonJS guard first and refuses early options in `tools/scripts/stackra-verify.mjs` (`judgeNodeSource`, `JUDGE_GUARD`) — covers: FR-004, AC-004 — route: tests — deps: T001
- [x] T007 The guard's start checks for preloads, inline and stdin scripts in `tools/scripts/stackra-verify.mjs` (`judgeGuard`) — covers: FR-005, AC-004, AC-005 — route: tests — deps: T006
- [x] T008 Refuse code with no file to check where eval is off in `tools/scripts/stackra-verify.mjs` (`judgeGuard`) — covers: FR-006, AC-006 — route: tests — deps: T006
- [x] T009 The inline marker mounted for validate only and the PR facts reader as a file in `tools/scripts/stackra-verify.mjs` (`runJob`, `stepScript`, `kindFiles`, `kindMounts`) — covers: FR-005, FR-007, AC-007, AC-008 — route: tests — deps: T007

- [x] T013 Test first (`#1118 CTO review` test, the `--experimental-sea-config` bypass), then the guarded node's scan fails closed on an unknown option in `tools/scripts/stackra-verify.mjs` (`judgeNodeSource`, `NODE_FLAG_OPTIONS`) with `tools/scripts/__tests__/stackra-verify.test.mjs` — covers: FR-004, AC-009 — route: tests — deps: T006
- [x] T014 Mirror main's new mobile job step (`mobile-test`, "Test the mobile app") in `tools/scripts/stackra-verify.mjs` (`MOBILE_STEPS`) with `tools/scripts/__tests__/stackra-verify.test.mjs` — covers: FR-001, AC-010 — route: tests — deps: T001

## Phase 4: Polish

- [x] T010 Keep `tools/policy/licences.json` as JSON and the OSV canary lockfile as block YAML in `packages/developer/repo-checks/src/node/constants/must-stay-json.constant.ts` with `packages/developer/repo-checks/src/node/functions/__tests__/repository-checks.test.ts`, `tools/scripts/osv-canary.lock.yaml` and `.changeset/repo-checks-licence-policy-json.md` — covers: AC-001 — route: steward-docs
- [x] T011 Document the guard in the header of `tools/scripts/stackra-verify.mjs` — covers: AC-004, AC-005, AC-006, AC-007 — route: steward-docs — deps: T009
- [ ] T012 The box-1 proof rerun of #1118 on the fixed head, run by the lead, in `tools/scripts/stackra-verify.mjs` — covers: AC-002, AC-004, AC-005, AC-006 — route: verify-fix — deps: T011
