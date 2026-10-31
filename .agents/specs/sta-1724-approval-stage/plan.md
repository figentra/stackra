# Implementation Plan: Declarative approval stage (second approver, four-eyes)

**Spec**: `.agents/specs/sta-1724-approval-stage/spec.md` · **Linear**: STA-1724 · **Date**: 2026-10-31 · **ADR**:
0507 (Proposed)

## Summary

One approval model, extended, not a second one. The existing approval step of `ActionPipeline` keeps its place; what
changes:

1. **Declaration.** `Action({ approval })` takes `true` or `ActionApproval { approvals, permission, expiresAfter, when
}`. `when` names an `ApprovalCondition` class (code) that reads its threshold from data.
2. **Port.** `ApprovalGate.check` becomes `decide` (read only), `park` (write), `find` (read one request) and
   `settle` (record the outcome). The pipeline, not the driver, compares a request with the call
   (`verifyApproval`, a pure function beside `approverRefusal`) and enforces `max(declared, decided)`.
3. **Park outside the rollback.** Under ADR 0495 the step runs inside `CallIsolation.run`; the refusal rolls the
   transaction back, so the pipeline parks after it, in a new isolation run for the same actor, exactly like the
   refused call's rate-limit usage event on the 0495 branch.
4. **Execute on grant.** The store publishes `actions.approval.granted.v1`; `ApprovalExecutor` in the owning service
   runs the call as the stored requester with `approvalId` and the Idempotency-Key `approval:<id>`, then settles the
   request.
5. **Store in OS.** Table, RLS, approve, reject, withdraw, list, get and the sweep live in the OS tasks-approvals
   module (L-05). Core ships a memory driver and a port conformance suite.

### Pipeline, after this change (actions)

```text
tenancy → live-config guard
└─ CallIsolation.run (0495)
   permission (+ step-up) → preconditions → entitlement → flag → validation
   → APPROVAL: declared = condition ? declaration : none
               decided  = gate.decide(call, input, declared)       // may add, never remove
               need     = max(declared, decided)
               approvalId given → gate.find → verifyApproval (core) → pass | refuse
               need and no id   → mark state.parking, throw ApprovalRequiredError
   → idempotency (key forced to approval:<id> when an id is given) → rate limit → interceptors → unit of work → handle
└─ after the isolation transaction ends:
   state.parking → CallIsolation.run(actor, scope, () => gate.park(draft)) → refusal carries the new id
```

The audit's `refused` entry is written outside, as today, after the park, so it carries `approvalId`.

### Where each piece lives

| Piece                                                                                                 | Member                                     |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `ActionApproval` option, `ApprovalCondition` base, stage, `verifyApproval`, errors, `ApprovalGranted` | `packages/application/actions`             |
| `ApprovalGate` port (`decide`, `park`, `find`, `settle`), `ApprovalRecord`, `ApprovalRequirement`     | `packages/application/actions` (contracts) |
| `MemoryApprovalGateDriver` and the port conformance suite (`./testing`)                               | `packages/application/actions`             |
| `ApprovalExecutor` listener                                                                           | `packages/application/actions` (node)      |
| `AgentRuntime.resume` taking an executed outcome                                                      | `packages/application/ai`                  |
| `approve(id, approver: Actor)` with `approverRefusal`                                                 | `packages/state/settings`                  |
| Table, RLS, approve/reject/withdraw/list/get actions, sweep, lifecycle events, inbox                  | OS tasks-approvals (not in this repo)      |

`OpenApprovalGateDriver` stays for `approval: true` actions; a declared stage refuses with it bound (it cannot park),
which is the fail-closed rule of SC-003.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                                                   |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | core holds the port, stage and memory driver; the store is OS behind the port (ADR 0260); ai already depends on actions; settings gains `@stackra/actions/contracts` for `approverRefusal` only (L-07) |
| Secrets (ADR 0173)                    | PASS   | no secret; a `credential` data-class input cannot declare approval (FR-003)                                                                                                                            |
| Security                              | PASS   | fail closed (FR-005, SC-003); checks in core (FR-008); requester authority only (FR-011); security review required before build                                                                        |
| HTTP and events                       | PASS   | approve, reject and withdraw are PUT state transitions on `/requests/:requestId/<verb>`; list and get are queries; events are versioned, ids only                                                      |
| Tenancy                               | PASS   | store rows tenant-owned with FORCE RLS in OS; park and execution run in the requester's isolation (0495); isolation test required in OS                                                                |
| Delegation                            | PASS   | each task names its route; security review before merge of phase 2                                                                                                                                     |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology; no external state-machine library (status is a plain enum)                                                                                                         |
| Test placement (ADR 0022)             | PASS   | `src/**/__tests__/` beside each subject                                                                                                                                                                |
| Versions and catalogs                 | PASS   | no new dependency                                                                                                                                                                                      |
| Deploy modes (ADR 0076)               | PASS   | same behaviour in every mode (table below)                                                                                                                                                             |
| Licence tier (ADR 0077)               | PASS   | core parts free (MIT)                                                                                                                                                                                  |
| Docs and ADRs                         | PASS   | ADR 0507 drafted; actions README, AGENTS.md and guide page in phase 2                                                                                                                                  |

## Deploy modes

| Mode       | Behaviour                                                                                            |
| ---------- | ---------------------------------------------------------------------------------------------------- |
| SaaS       | OS tasks-approvals driver bound; grants reach the owning service through the outbox and event bus    |
| On-prem    | same; a single-operator install cannot complete a declared four-eyes action (L-10)                   |
| Air-gapped | same; no outbound call: the store, the event and the executor are inside the tenant's own deployment |

## Lanes and pull requests (ADR 0120 D8)

Full lane, change risk R3. One design PR (this folder and ADR 0507), then one PR per phase:

| PR  | Phase                | Members                         | Blocked by                      |
| --- | -------------------- | ------------------------------- | ------------------------------- |
| 0   | Design               | spec, plan, tasks, ADR 0507     | lead approval, security review  |
| 1   | US1 core stage       | actions                         | PR 0; rebased on 0495 if merged |
| 2   | US1 executor and US2 | actions                         | PR 1                            |
| 3   | US3 agents and floor | actions, ai                     | PR 2                            |
| 4   | US4 settings         | settings                        | PR 1; L-07; ADR 0496 outcome    |
| —   | OS store, billing    | OS repository, figentra/billing | PR 2 published                  |

If 0495 is not merged when PR 1 starts, PR 1 parks after the refusal without isolation (FR-006's no-isolation path)
and PR 1's 0495 test lands with the rebase.

## Correctness properties

- **P-001**: `Action()` accepts `true` or a well-formed `ActionApproval` and refuses any other shape, a zero or fractional `approvals`, an unparsable `expiresAfter` and a `when` that is not an `ApprovalCondition` — Validates: FR-001, FR-002
- **P-002**: gen refuses `approval` on a query, on an action no user or agent may call, and on an input with a `credential` field — Validates: FR-003
- **P-003**: the approval step runs after validation and before the idempotency claim, inside the isolation callback, and only for actions — Validates: FR-004
- **P-004**: with a declared requirement, a gate answering "none" (including the open gate) still yields a park or refusal; a gate answering more raises the requirement — Validates: FR-005, FR-018
- **P-005**: under a `CallIsolation` that rolls back on refusal, the parked request exists after the call and the refusal carries its id, count and expiry and no input — Validates: FR-006, FR-009
- **P-006**: the stored draft holds every field of FR-007 and its hash equals `fingerprintOf(key, validated input)` — Validates: FR-007
- **P-007**: `verifyApproval` refuses each mismatch (tenant, scope, requester, key, hash), each status other than granted, a consumed or out-of-window request, too few distinct votes and a vote in the requester's chain, each with its own code — Validates: FR-008, FR-009
- **P-008**: the memory driver's approve refuses self, chain, duplicate, unpermitted and expired votes, and a voter who lost the permission does not count at grant — Validates: FR-010
- **P-009**: on grant the executor runs the call as the stored requester with `approvalId` and key `approval:<id>`; the actor seen by `AccessControl` is the requester, never the approver — Validates: FR-011
- **P-010**: a duplicate grant runs `handle` once; a refused execution settles `failed` with its code; a non-refusal error leaves `executing` and a retry with the same key completes — Validates: FR-012
- **P-011**: a resubmission of an `on_grant` request is refused `approval_consumed`; an `on_resubmit` request runs on resubmission; `AgentRuntime.resume` with an executed outcome dispatches nothing — Validates: FR-013
- **P-012**: the get and list views drop the fields the viewer may not read — Validates: FR-014
- **P-013**: approve and verify refuse after `expiresAt` with the sweep never run; a granted request executes until `grantedAt + 24h` — Validates: FR-015
- **P-014**: a declared action with `stepUp` checks the requester at request time and executes with the stored assurance — Validates: FR-016
- **P-015**: the refused entry carries `approvalId` and `inputHash`, the execution's entry carries `approvalId` and the voters, and no event payload carries input — Validates: FR-017
- **P-016**: `SettingsResolver.approve` refuses an agent acting for the author and still refuses the author — Validates: FR-019
- **P-017**: billing's coupon case (a threshold condition reading a setting, one approver, `financial`) passes the US1 scenarios against the memory driver in core's tests — Validates: FR-020

## Risks

- The port change breaks every `ApprovalGate` implementer: today only `OpenApprovalGateDriver` and test fakes in core;
  the OS driver is not built.
- 0495 is Proposed; if it changes how refusals roll back, FR-006 follows it.
- A long approval holds an input snapshot of personal data in OS for up to `expiresAfter`; retention is the request's
  own (deleted with the tenant, kept with the audit's hash only after it ends: an OS decision).
