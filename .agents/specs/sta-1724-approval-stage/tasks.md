# Tasks: Declarative approval stage (second approver, four-eyes)

**Input**: `.agents/specs/sta-1724-approval-stage/`

Nothing below starts before the lead approves the design (PR 0) and the security review has read it. Each task is one
member; its verifying test is the task after it or named in it.

## Phase 0: Design

- [ ] T001 Spec, plan, tasks and ADR 0509 in `.agents/specs/sta-1724-approval-stage/` and `apps/docs/src/docs/adr/0509-the-approval-stage-a-declared-floor-of-distinct-approvers-checked-in-core-executed-as-the-requester.mdx` — covers: SC-001, SC-002 — route: spec-draft
- [ ] T002 Security review of the design (spec Security notes, ADR 0509) — covers: SC-003, SC-004 — route: review — deps: T001

## Phase 1: US1 core stage (PR 1, actions)

- [ ] T003 [US1] `ActionApproval` type and `approval` validation in `packages/application/actions/src/core/types/action-approval.type.ts` and `packages/application/actions/src/core/bases/action.base.ts` — covers: FR-001 — route: package — deps: T002
- [ ] T004 [US1] `ApprovalCondition` kind base with its static `reads` and a settings reader limited to `reads` that throws on any other key, in `packages/application/actions/src/core/bases/approval-condition.base.ts` — covers: FR-002 — route: package — deps: T002
- [ ] T005 [US1] Port split (`decide`, `park`, `find`, `settle`), `ApprovalRequirement`, `ApprovalRecord`, `ApprovalStatus` in `packages/application/actions/src/contracts/ports/approval-gate.port.ts`; `OpenApprovalGateDriver` updated — covers: FR-005, FR-007 — route: package — deps: T002
- [ ] T022 [US1] `actorChainOverlaps(a, b)` with its test in `packages/foundation/contracts/src/core/functions/actor-chain-overlaps.function.ts` and `packages/foundation/contracts/src/core/functions/__tests__/actor-chain-overlaps.function.test.ts`; exported from the core entry — covers: FR-019, P-018 — route: package — deps: T002
- [ ] T025 [US1] `actorsSharePerson(identity, a, b)` and the `IdentityResolver.personOf(usr)` port method, with the interim verified-email-or-phone rule and fail-closed refusal, and their tests, in `packages/foundation/contracts/src/core/functions/actors-share-person.function.ts`, `packages/foundation/contracts/src/core/ports/identity-resolver.port.ts` and `packages/foundation/contracts/src/core/functions/__tests__/actors-share-person.function.test.ts` — covers: FR-022, P-020 — route: auth — deps: T022
- [ ] T023 [US1] `ApprovalBindingStore` port and `ApprovalBinding` type in `packages/application/actions/src/contracts/ports/approval-binding-store.port.ts`, and `MemoryApprovalBindingStoreDriver` in `packages/application/actions/src/testing/` — covers: FR-007, FR-008 — route: package — deps: T002
- [ ] T006 [US1] `verifyApproval` (binding against call, snapshot hash against binding, status `granted` or own `executing`, window by the binding's clock, distinct people by `actorsSharePerson`, requester active and delegations valid) in `packages/application/actions/src/core/functions/verify-approval.function.ts`, the new refusals (`ApprovalPendingLimitError` included) in `packages/application/actions/src/core/errors/`; `approverRefusal` calls `actorChainOverlaps` instead of its own chain walk — covers: FR-008, FR-009, FR-019, FR-022 — route: auth — deps: T005, T022, T023, T025
- [ ] T007 [US1] The stage in `packages/application/actions/src/core/services/action-pipeline.service.ts`: declared requirement, `max(declared, decided)`, verify, refusal of a chain whose root is not a user, a rate-limit token per park, binding then park after the isolation transaction, no input in park-failure logs, forced key `approval:<id>` and refusal of a caller's `approval:` key, step-up conditions (a), (b) and (e), audit fields — covers: FR-004, FR-005, FR-006, FR-016, FR-017, FR-018 — route: package — deps: T003, T004, T005, T006, T023
- [ ] T008 [US1] `MemoryApprovalGateDriver` (the FR-021 states with compare-and-set, approve with `approverRefusal` and `actorsSharePerson`, one vote per person, re-check of active voters, permission and refusals at the final vote, operator-access and customer-realm votes refused, voter realm recorded, approver assurance level enforced per vote (from the draft), approver step-up for `stepUp` and L3/L4 actions, expiry, pending cap) and the port conformance suite in `packages/application/actions/src/testing/` — covers: FR-010, FR-015, FR-016, FR-021 — route: package — deps: T005, T025
- [ ] T009 [US1] Tests: `action.base.test.ts`, `verify-approval.function.test.ts` (with the tampered-row cases), the stage cases in `action-pipeline.service.test.ts`, the memory drivers' conformance run (realm, approver level, identity outage, token before insert) — covers: P-022, P-001, P-003, P-004, P-005, P-006, P-007, P-008, P-013, P-014, P-019, P-021 — route: tests — deps: T007, T008
- [ ] T024 [US1] `ApprovalBinding` model (`BelongsToTenant`, insert-only, actor chain and input hash in its docs and the PII table), its migration (`tenancy.approval_bindings`, FORCE RLS), `PostgresApprovalBindingStoreDriver` (insert, read, no update) and `PruneApprovalBindingsAction` (`approval_binding.prune`, daily) in `packages/security/tenancy/src/node/`, with a real-Postgres isolation test (another tenant's binding is invisible) — covers: FR-007, P-019 — route: tenancy — deps: T023

## Phase 2: US1 executor and US2 (PR 2, actions)

- [ ] T010 [US1] `ApprovalGranted` integration event in `packages/application/actions/src/contracts/` and `ApprovalExecutor` listener in `packages/application/actions/src/node/listeners/approval-executor.listener.ts`: envelopes from the store's service only, no inbox actor in the context, the binding read in a `CallIsolation.run` for the event's tenant as that scope's system actor (never a platform or `BYPASSRLS` read), the call built only from the binding and run in a separate fresh run as the binding's actor, identity outages retried, snapshot hash check, `ScopeOwnership`, `granted → executing` compare-and-set, its own `CallIsolation.run`, key `approval:<id>`, `settle` by compare-and-set, in-flight answers never settle `failed`, `unknown` after 24h — covers: FR-011, FR-012 — route: package — deps: T009, T024
- [ ] T011 [US2] Execution window and status checks for expired, rejected and withdrawn requests in `packages/application/actions/src/core/functions/verify-approval.function.ts` — covers: FR-015 — route: auth — deps: T009
- [ ] T012 [US1] Gen: refuse an `expiresAfter` above 30 days, `approval` on a query, on an action with any actor kind other than `User`, `Agent` or `ExternalAgent` (allow-list), a condition constructor dependency other than its limited settings reader and plan and entitlement values, on a `credential` input field, and a condition whose `reads` names a key not marked `approval`, in `packages/developer/gen` — covers: FR-002, FR-003 — route: gen — deps: T009
- [ ] T013 [US1] Tests for the executor, duplicates, failures and retries, the gen refusals, and the billing-shaped case — covers: P-002, P-009, P-010, P-015, P-017 — route: tests — deps: T010, T011, T012
- [ ] T014 Docs: `packages/application/actions/README.md`, `packages/application/actions/AGENTS.md` and the actions guide page — covers: FR-020 — route: steward-docs — deps: T013

## Phase 3: US3 agents and the floor (PR 3, actions and ai)

- [ ] T015 [US3] Resubmission rules (`on_grant` refused `approval_consumed`, `on_resubmit` runs) in `packages/application/actions/src/core/services/action-pipeline.service.ts` — covers: FR-013, FR-018 — route: package — deps: T013
- [ ] T016 [US3] `AgentRuntime.resume` takes an executed outcome in `packages/application/ai/src/core/services/agent-runtime.service.ts` and `packages/application/ai/src/core/types/resume-decision.type.ts` — covers: FR-013 — route: package — deps: T015
- [ ] T017 [US3] Tests: bypass keeps the declared approvals; resume dispatches nothing for an executed request — covers: P-004, P-011 — route: tests — deps: T016

## Phase 4: US4 settings (PR 4, settings; in the ADR 0496 rewrite if it lands first)

- [ ] T018 [US4] `approve` and `reject` take an `Actor` and refuse through `actorChainOverlaps` and `actorsSharePerson` in `packages/state/settings/src/core/services/settings-resolver.service.ts` — covers: FR-019 — route: package — deps: T022, T025
- [ ] T019 [US4] Tests in `packages/state/settings/src/core/services/__tests__/settings-resolver.service.test.ts` — covers: P-016 — route: tests — deps: T018

## Phase 5: Outside core (tracked, not built here)

- [ ] T020 OS tasks-approvals: table with FORCE RLS, driver passing the conformance suite (FR-021 states, pending cap), approve/reject/withdraw (`tool: false` with a reason, operator-access votes refused) and list/get (object-level access: approver permission in scope or requester's chain; `redactFields`), snapshot deleted at a final state and listed in the PII table, sweep, lifecycle events without input hash, isolation test — covers: FR-010, FR-014, FR-015, FR-021, P-012 — route: os-port — deps: T013
- [ ] T021 figentra/billing#2: coupon create and update declare the stage; hand-written pending state, approver check and expiry deleted — covers: FR-020, SC-001 — route: linear — deps: T020
- [ ] T026 identity: the person link, a `personOf` driver in `packages/security/identity` returning a stable person or verified-identity key (dependency, routed via the leader) — covers: FR-022 — route: linear — deps: T025
- [ ] T027 identity: "sessions revoked or factors reset since T" for a `usr_` id, read by FR-016 (e) (dependency, routed via the leader) — covers: FR-016 — route: linear — deps: T002
- [ ] T028 When ADR 0509 is accepted, add the amendment note on `apps/docs/src/docs/adr/0207-authentication-assurance-and-machine-identities.mdx` (decision 1, approved calls) — covers: FR-016 — route: adr — deps: T001
