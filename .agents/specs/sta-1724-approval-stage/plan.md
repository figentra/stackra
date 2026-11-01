# Implementation Plan: Declarative approval stage (second approver, four-eyes)

**Spec**: `.agents/specs/sta-1724-approval-stage/spec.md` · **Linear**: STA-1724 · **Date**: 2026-10-31 · **ADR**:
0509 (Proposed)

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
5. **A binding in the owning service (B1).** At park, the owning service writes its own tenant-owned binding (who,
   where, which action, input hash, assurance, times, requirements) in the same isolation run. Execution is built only
   from the binding; the store supplies status, votes and the snapshot, which must hash to the binding.
6. **One person, several ids (C4).** Self-approval and voter counting go by person, through `actorsSharePerson` and
   a new `IdentityResolver.personOf`; until that exists, equal verified email or phone; unreachable identity refuses.
7. **Store in OS.** Table, RLS, approve, reject, withdraw, list, get and the sweep live in the OS tasks-approvals
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

| Piece                                                                                                 | Member                                                           |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `ActionApproval` option, `ApprovalCondition` base, stage, `verifyApproval`, errors, `ApprovalGranted` | `packages/application/actions`                                   |
| `ApprovalGate` port (`decide`, `park`, `find`, `settle`), `ApprovalRecord`, `ApprovalRequirement`     | `packages/application/actions` (contracts)                       |
| `MemoryApprovalGateDriver` and the port conformance suite (`./testing`)                               | `packages/application/actions`                                   |
| `ApprovalExecutor` listener                                                                           | `packages/application/actions` (node)                            |
| `AgentRuntime.resume` taking an executed outcome                                                      | `packages/application/ai`                                        |
| `ApprovalBindingStore` port and `ApprovalBinding` type; memory binding driver                         | `packages/application/actions` (contracts, testing)              |
| `ApprovalBinding` model, migration (`tenancy.approval_bindings`, FORCE RLS), Postgres binding driver  | `packages/security/tenancy` (node)                               |
| `actorsSharePerson(identity, a, b)` and `IdentityResolver.personOf` (port method)                     | `packages/foundation/contracts`                                  |
| `personOf` driver                                                                                     | `packages/security/identity` (dependency row: routed via leader) |
| `actorChainOverlaps(a, b)`, the one chain check (L-07)                                                | `packages/foundation/contracts`                                  |
| `approve(id, approver: Actor)` through `actorChainOverlaps` and `actorsSharePerson`                   | `packages/state/settings`                                        |
| Table, RLS, approve/reject/withdraw/list/get actions, sweep, lifecycle events, inbox                  | OS tasks-approvals (not in this repo)                            |

`OpenApprovalGateDriver` stays for `approval: true` actions; a declared stage refuses with it bound (it cannot park),
which is the fail-closed rule of SC-003.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | the port, stage and memory drivers are in actions; the binding model and migration are in tenancy, which already depends on actions (actions cannot use `BelongsToTenant`); the store is OS behind the port (ADR 0260); the shared chain and person checks are in `@stackra/contracts`, which actions and settings already depend on (L-07) |
| Secrets (ADR 0173)                    | PASS   | no secret; a `credential` data-class input cannot declare approval (FR-003)                                                                                                                                                                                                                                                                 |
| Security                              | PASS   | fail closed (FR-005, SC-003); checks in core (FR-008); requester authority only (FR-011); security review required before build                                                                                                                                                                                                             |
| HTTP and events                       | PASS   | approve, reject and withdraw are PUT state transitions on `/requests/:requestId/<verb>`; list and get are queries; events are versioned, ids only                                                                                                                                                                                           |
| Tenancy                               | PASS   | store rows and binding rows are tenant-owned with FORCE RLS; park and execution run in the requester's isolation (0495) from the binding; isolation tests in T020 and for the binding driver                                                                                                                                                |
| Delegation                            | PASS   | each task names its route; security review before merge of phase 2                                                                                                                                                                                                                                                                          |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology; no external state-machine library (status is a plain enum)                                                                                                                                                                                                                                              |
| Test placement (ADR 0022)             | PASS   | `src/**/__tests__/` beside each subject                                                                                                                                                                                                                                                                                                     |
| Versions and catalogs                 | PASS   | no new dependency                                                                                                                                                                                                                                                                                                                           |
| Deploy modes (ADR 0076)               | PASS   | same behaviour in every mode (table below)                                                                                                                                                                                                                                                                                                  |
| Licence tier (ADR 0077)               | PASS   | core parts free (MIT)                                                                                                                                                                                                                                                                                                                       |
| Docs and ADRs                         | PASS   | ADR 0509 drafted; actions README, AGENTS.md and guide page in phase 2                                                                                                                                                                                                                                                                       |

## Deploy modes

| Mode       | Behaviour                                                                                            |
| ---------- | ---------------------------------------------------------------------------------------------------- |
| SaaS       | OS tasks-approvals driver bound; grants reach the owning service through the outbox and event bus    |
| On-prem    | same; a single-operator install cannot complete a declared four-eyes action (L-10)                   |
| Air-gapped | same; no outbound call: the store, the event and the executor are inside the tenant's own deployment |

## Lanes and pull requests (ADR 0120 D8)

Full lane, change risk R3. One design PR (this folder and ADR 0509), then one PR per phase:

| PR  | Phase                       | Members                                   | Blocked by                                            |
| --- | --------------------------- | ----------------------------------------- | ----------------------------------------------------- |
| 0   | Design                      | spec, plan, tasks, ADR 0509               | lead approval, security review                        |
| 1   | US1 core stage              | actions, contracts, tenancy               | PR 0; rebased on 0495 if merged                       |
| 2   | US1 executor and US2        | actions                                   | PR 1                                                  |
| 3   | US3 agents and floor        | actions, ai                               | PR 2                                                  |
| 4   | US4 settings                | settings                                  | PR 1; lands in the 0496 rewrite if it merges first    |
| —   | OS store, billing, identity | OS repository, figentra/billing, identity | PR 2 published; the person link routed via the leader |

If 0495 is not merged when PR 1 starts, PR 1 parks after the refusal without isolation (FR-006's no-isolation path)
and PR 1's 0495 test lands with the rebase.

## Correctness properties

- **P-001**: `Action()` accepts `true` or a well-formed `ActionApproval` and refuses any other shape, a zero or fractional `approvals`, an unparsable `expiresAfter` or one above 30 days, and a `when` that is not an `ApprovalCondition` — Validates: FR-001, FR-002
- **P-002**: gen refuses `approval` on a query, on an action with any actor kind other than `User`, `Agent` or `ExternalAgent`, on an input with a `credential` field, on a condition whose `reads` names a key not marked `approval`, and on a condition with any constructor dependency (it receives its limited settings reader as an argument); the limited reader throws on a key not in `reads` — Validates: FR-002, FR-003
- **P-003**: the approval step runs after validation and before the idempotency claim, inside the isolation callback, and only for actions — Validates: FR-004
- **P-004**: with a declared requirement, a gate answering "none" (including the open gate) still yields a park or refusal; a gate answering more raises the requirement — Validates: FR-005, FR-018
- **P-005**: under a `CallIsolation` that rolls back on refusal, the binding and the parked request exist after the call and the refusal carries its id, count and expiry and no input; a chain whose root is not a user is refused before parking; a park takes a rate-limit token and the store's cap refuses `approval_pending_limit`; a failed park logs no input — Validates: FR-006, FR-009
- **P-006**: the binding holds every field of FR-007 (hash `fingerprintOf(key, validated input)`, assurance, `requestedAt`, `expiresAt` by the owning clock) and the draft holds its own fields — Validates: FR-007
- **P-007**: `verifyApproval` refuses each mismatch (tenant, scope, requester, key, hash), each status other than granted, a consumed or out-of-window request, too few distinct votes and a vote in the requester's chain, each with its own code — Validates: FR-008, FR-009
- **P-008**: the memory driver's approve refuses self, chain, duplicate, unpermitted, expired and operator-access votes; at the final vote an inactive, unpermitted or newly refused voter does not count — Validates: FR-010
- **P-009**: on grant the executor runs the call as the stored requester with `approvalId` and key `approval:<id>`; the actor seen by `AccessControl` is the requester, never the approver — Validates: FR-011
- **P-010**: a duplicate or concurrent grant runs `handle` once and never settles `failed` on `idempotency_key_reused` or `approval_consumed`; `settle` is a compare-and-set from `executing`; a refused execution settles `failed`; a non-refusal error leaves `executing` for a retry with the same key; `executing` past 24h becomes `unknown`; a caller-sent `approval:` key is refused — Validates: FR-012
- **P-011**: a resubmission of an `on_grant` request is refused `approval_consumed`; an `on_resubmit` request runs on resubmission; `AgentRuntime.resume` with an executed outcome dispatches nothing — Validates: FR-013
- **P-012**: get and list show a request only to a holder of its approver permission in its scope or a member of its requester's chain, drop the fields the viewer may not read, and a final request has no snapshot — Validates: FR-014
- **P-013**: approve and verify refuse after `expiresAt` with the sweep never run, by the binding's clock; a granted request executes until `grantedAt + 24h` — Validates: FR-015
- **P-014**: execution uses the binding's assurance only; `StepUpCheck` is evaluated against `requestedAt` for that call and not for its nested calls or a resumed run; approvers of a `stepUp` or L3/L4 action must step up whatever the rule says; a requester whose sessions were revoked or factors reset after `requestedAt` is refused `step_up_required` — Validates: FR-016
- **P-015**: the refused entry carries `approvalId` and `inputHash`, the execution's entry carries `approvalId` and the voters, and no event payload carries input or the input hash — Validates: FR-017
- **P-018**: `actorChainOverlaps` is true for the same principal, an agent acting for the other, and the human an agent acts for, false for unrelated chains; `approverRefusal` and `SettingsResolver.approve` both call it and walk no chain of their own — Validates: FR-019
- **P-016**: `SettingsResolver.approve` refuses an agent acting for the author, the author's other `usr_` id, and any vote when identity cannot answer, and still refuses the author — Validates: FR-019
- **P-017**: billing's coupon case (a threshold condition reading a setting, one approver, `financial`) passes the US1 scenarios against the memory driver in core's tests — Validates: FR-020

- **P-019**: a store row whose actor, tenant, scope, key or input snapshot was changed after park is refused `approval_mismatch` by verify and by the executor, which reads the binding in a `CallIsolation.run` for the event's tenant as that scope's system actor (never a platform or `BYPASSRLS` read), builds the call only from it, runs it in a separate fresh run as the binding's actor, acts only on envelopes from the store's service and checks `ScopeOwnership`; the binding is never updated and is deleted only by `approval_binding.prune` — Validates: FR-007, FR-008, FR-011
- **P-020**: `actorsSharePerson` is true for overlapping chains and for two `usr_` ids with the same `personOf` key or, without `personOf`, the same verified email or phone; it refuses (throws) when identity cannot answer; two ids of one person count as one vote — Validates: FR-022, FR-008, FR-010
- **P-021**: the store moves only along FR-021's table: reject and withdraw only from `pending`, `granted → executing` by compare-and-set, `executing` accepted by verify only for its own key — Validates: FR-021

- **P-022**: a vote from a customer-realm user is refused `forbidden` and every recorded vote carries the voter's realm; a vote below the request's approver assurance level is refused `step_up_required`; an identity outage at execution leaves the request `executing` and never `failed`; the rate-limit token is taken before the binding insert — Validates: FR-010, FR-012, FR-016, FR-006

## Risks

- The port change breaks every `ApprovalGate` implementer: today only `OpenApprovalGateDriver` and test fakes in core;
  the OS driver is not built.
- 0495 is Proposed; if it changes how refusals roll back, FR-006 follows it.
- A long approval holds an input snapshot of personal data in OS for up to `expiresAfter`; retention is the request's
  own (deleted with the tenant, kept with the audit's hash only after it ends: an OS decision).
