# Tasks: Declarative approval stage (second approver, four-eyes)

**Input**: `.agents/specs/sta-1724-approval-stage/`

Nothing below starts before the lead approves the design (PR 0) and the security review has read it. Each task is one
member; its verifying test is the task after it or named in it.

## Phase 0: Design

- [ ] T001 Spec, plan, tasks and ADR 0509 in `.agents/specs/sta-1724-approval-stage/` and `apps/docs/src/docs/adr/0509-the-approval-stage-a-declared-floor-of-distinct-approvers-checked-in-core-executed-as-the-requester.mdx` — covers: SC-001, SC-002 — route: spec-draft
- [ ] T002 Security review of the design (spec Security notes, ADR 0509) — covers: SC-003, SC-004 — route: review — deps: T001

## Phase 1: US1 core stage (PR 1, actions)

- [ ] T003 [US1] `ActionApproval` type and `approval` validation in `packages/application/actions/src/core/types/action-approval.type.ts` and `packages/application/actions/src/core/bases/action.base.ts` — covers: FR-001 — route: package — deps: T002
- [ ] T004 [US1] `ApprovalCondition` kind base in `packages/application/actions/src/core/bases/approval-condition.base.ts` — covers: FR-002 — route: package — deps: T002
- [ ] T005 [US1] Port split (`decide`, `park`, `find`, `settle`), `ApprovalRequirement`, `ApprovalRecord`, `ApprovalStatus` in `packages/application/actions/src/contracts/ports/approval-gate.port.ts`; `OpenApprovalGateDriver` updated — covers: FR-005, FR-007 — route: package — deps: T002
- [ ] T022 [US1] `actorChainOverlaps(a, b)` with its test in `packages/foundation/contracts/src/core/functions/actor-chain-overlaps.function.ts` and `packages/foundation/contracts/src/core/functions/__tests__/actor-chain-overlaps.function.test.ts`; exported from the core entry — covers: FR-019, P-018 — route: package — deps: T002
- [ ] T006 [US1] `verifyApproval` in `packages/application/actions/src/core/functions/verify-approval.function.ts` and the four new refusals in `packages/application/actions/src/core/errors/`; `approverRefusal` calls `actorChainOverlaps` instead of its own chain walk — covers: FR-008, FR-009, FR-019 — route: auth — deps: T005, T022
- [ ] T007 [US1] The stage in `packages/application/actions/src/core/services/action-pipeline.service.ts`: declared requirement, `max(declared, decided)`, verify, park after the isolation transaction, forced key `approval:<id>`, audit fields — covers: FR-004, FR-005, FR-006, FR-016, FR-017, FR-018 — route: package — deps: T003, T004, T005, T006
- [ ] T008 [US1] `MemoryApprovalGateDriver` (approve with `approverRefusal`, one vote per user, permission re-check at grant, expiry) and the port conformance suite in `packages/application/actions/src/testing/` — covers: FR-010, FR-015 — route: package — deps: T005
- [ ] T009 [US1] Tests: `action.base.test.ts`, `verify-approval.function.test.ts`, the stage cases in `action-pipeline.service.test.ts`, the memory driver's conformance run — covers: P-001, P-003, P-004, P-005, P-006, P-007, P-008, P-013, P-014 — route: tests — deps: T007, T008

## Phase 2: US1 executor and US2 (PR 2, actions)

- [ ] T010 [US1] `ApprovalGranted` integration event in `packages/application/actions/src/contracts/` and `ApprovalExecutor` listener in `packages/application/actions/src/node/listeners/approval-executor.listener.ts` (stored requester, `approvalId`, key `approval:<id>`, `settle`) — covers: FR-011, FR-012 — route: package — deps: T009
- [ ] T011 [US2] Execution window and status checks for expired, rejected and withdrawn requests in `packages/application/actions/src/core/functions/verify-approval.function.ts` — covers: FR-015 — route: auth — deps: T009
- [ ] T012 [US1] Gen: refuse an `expiresAfter` above 30 days, `approval` on a query, on an action with no user or agent actor, and on a `credential` input field, in `packages/developer/gen` — covers: FR-003 — route: gen — deps: T009
- [ ] T013 [US1] Tests for the executor, duplicates, failures and retries, the gen refusals, and the billing-shaped case — covers: P-002, P-009, P-010, P-015, P-017 — route: tests — deps: T010, T011, T012
- [ ] T014 Docs: `packages/application/actions/README.md`, `packages/application/actions/AGENTS.md` and the actions guide page — covers: FR-020 — route: steward-docs — deps: T013

## Phase 3: US3 agents and the floor (PR 3, actions and ai)

- [ ] T015 [US3] Resubmission rules (`on_grant` refused `approval_consumed`, `on_resubmit` runs) in `packages/application/actions/src/core/services/action-pipeline.service.ts` — covers: FR-013, FR-018 — route: package — deps: T013
- [ ] T016 [US3] `AgentRuntime.resume` takes an executed outcome in `packages/application/ai/src/core/services/agent-runtime.service.ts` and `packages/application/ai/src/core/types/resume-decision.type.ts` — covers: FR-013 — route: package — deps: T015
- [ ] T017 [US3] Tests: bypass keeps the declared approvals; resume dispatches nothing for an executed request — covers: P-004, P-011 — route: tests — deps: T016

## Phase 4: US4 settings (PR 4, settings; in the ADR 0496 rewrite if it lands first)

- [ ] T018 [US4] `approve` and `reject` take an `Actor` and refuse through `actorChainOverlaps` in `packages/state/settings/src/core/services/settings-resolver.service.ts` — covers: FR-019 — route: package — deps: T022
- [ ] T019 [US4] Tests in `packages/state/settings/src/core/services/__tests__/settings-resolver.service.test.ts` — covers: P-016 — route: tests — deps: T018

## Phase 5: Outside core (tracked, not built here)

- [ ] T020 OS tasks-approvals: table with FORCE RLS, driver passing the conformance suite, approve/reject/withdraw/list/get with `redactFields`, sweep, lifecycle events, isolation test — covers: FR-010, FR-014, FR-015, P-012 — route: os-port — deps: T013
- [ ] T021 figentra/billing#2: coupon create and update declare the stage; hand-written pending state, approver check and expiry deleted — covers: FR-020, SC-001 — route: linear — deps: T020
