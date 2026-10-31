# Feature Specification: Declarative approval stage (second approver, four-eyes) in the action pipeline

**Feature Branch**: `figentra/sta-1724-approval-stage`

**Created**: 2026-10-31

**Status**: Clarified <!-- design approved by the leader 2026-11-01; L-08 waits on the security-tenancy reviewer; nothing is built -->

**Linear**: STA-1724

**Clarifications status**: complete

**Input**: Billing (figentra/billing#2) needs a second approver before a coupon above a threshold is created or
changed, and today hand-writes the pending state, the second-approver check and the expiry. Requested shape, roughly
`Action({ approval: { approvers: 2, permission, expiresAfter } })`: park the call, record who approved, refuse
self-approval, run the handler on the final approval, and reuse what tasks-approvals and the AgentRuntime approval
modes already model. Done when billing's coupon code and settings' approval-gated keys could both use it.

## What exists today (read on origin/main, 2026-10-31)

- `@stackra/actions` already has an approval step between flag and idempotency (ADR 0098 decision 3, 0397 decision 5
  as amended by STA-813). `ApprovalGate.check(call, input, approvalId)` decides from tenant data, parks a request and
  throws `ApprovalRequiredError` (`approval_required`, 412, carrying `approvalId`); a resubmission naming a granted id
  runs. `approval: true` makes the step fail closed with no gate bound; `OpenApprovalGateDriver` passes everything.
  The only real driver is planned: the OS tasks-approvals service.
- `approverRefusal(rule, approver, requester)` already checks seat kind, self-approval through the whole
  `onBehalfOf` chain, and step-up (ADR 0398 decision 6).
- `@stackra/ai`: `resolveApproval` gives `confirm`, `named_approver`, `escalate`, `propose`, `run` or `refused` from
  the floor, matrix, policy and the user's mode (ADR 0360). `AgentRuntime` parks a run on `approval_required` and
  `resume` re-dispatches the parked tool call as the run's principal with the approval id.
- `@stackra/settings`: a change to a key marked `approval` writes a `pending` revision; `SettingsResolver.approve(id,
approver: string)` refuses the author (`SettingFourEyesError`, a plain id comparison, not the chain), then applies
  or schedules. One approver, no expiry.
- ADR 0495 (Proposed, branch `figentra/sta-1699-call-isolation`): everything after the tenancy check, approval
  included, runs inside `CallIsolation.run` in one transaction; a refusal rolls it back. A refused call's rate-limit
  usage event is therefore written after the transaction ends (`state.unmetered`). The same applies to a parked
  request written in the approval step: in-transaction, it is lost with the refusal.

So the gap is not a second mechanism. It is (a) a declaration in code that sets a floor the tenant's rules cannot
remove, (b) N distinct approvers with a per-request approver permission, expiry and an input hash, checked in core
rather than trusted to a driver, (c) execution on the final grant, and (d) a park that survives the call's rollback.

## Impact

- **Apps touched**: none
- **Services touched**: none in core. Outside core: the OS tasks-approvals module (the store driver, the approve,
  reject, withdraw, list and get actions, the sweep); figentra/billing (coupon actions adopt the declaration)
- **Packages touched**: packages/application/actions (option, port, stage, kind base, executor, memory driver,
  errors, event), packages/application/ai (`AgentRuntime.resume` for an executed request), packages/state/settings
  (the approver check uses the shared chain function; see L-07), packages/foundation/contracts
  (`actorChainOverlaps`)
- **Cross-service events**: new `actions.approval.granted.v1` (published by the store's service, consumed by the
  service that owns the action; ids only); the store's own lifecycle events `approvals.request.requested.v1`,
  `.approved.v1`, `.rejected.v1`, `.expired.v1`, `.executed.v1` (OS, ids, key, counts and input hash only, never input)
- **Tenancy and data**: one new tenant-owned table in the OS tasks-approvals module (`approvals.approval_requests` and
  `approvals.approval_votes`), `tenant_id` with FORCE RLS from the scoped-table pattern; holds an input snapshot
  (data-class rules in FR-014). Core adds no table; the memory driver is for tests and single-process dev
- **Secrets**: none
- **ADR needed**: yes, draft 0509 (Proposed) in this change; it amends 0098 decision 3, 0397 decision 5 and the
  `ApprovalGate` contract, and states the stage's place under 0495. 0509 is reserved in `apps/docs/adr/numbers.yaml` in this change (0507 and 0508 were taken)
- **New dependencies**: none
- **Deploy modes**: SaaS, on-prem and air-gapped the same; the store is a tenant table, no outbound call (see plan)
- **Licence tier**: free (MIT) in core; the OS store follows the OS licence
- **Docs to update**: `packages/application/actions/README.md` and `AGENTS.md`, the actions guide page in
  `apps/docs`, the ADR index row for 0509 when the owner accepts it
- **Lane**: full (an ADR, a public port change, several members)
- **Change risk**: R3 (auth and iam, tenancy, money: the stage gates financial actions and moves who may execute)

## User Scenarios & Testing

### US1: A declared second approver (P1, billing)

A billing admin updates a coupon to 40% off. `UpdateCouponAction` declares `approval: { permission:
CouponPermissions.approve, when: CouponAboveThresholdCondition }`. The call is refused `approval_required` with an
approval id; nothing of `handle` ran. A second admin with `billing.coupon.approve` approves in the approvals inbox. The
coupon changes, as the requester, without the requester coming back.

1. **Given** a call whose condition is true and no approval id, **when** it runs, **then** it is refused
   `approval_required` with `approvalId`, `approvalsRequired` and `expiresAt`, a pending request exists after the
   refusal, and the audit trail has one `refused` entry with code `approval_required`.
2. **Given** the condition is false (a 5% coupon), **when** it runs, **then** no request is parked and it runs.
3. **Given** a pending request, **when** the requester approves it, **then** it is refused `self_approval`; the same
   for an agent acting for the requester and for the human an agent requester acts for.
4. **Given** a pending request needing two approvals, **when** one approver approves twice, **then** the second is
   refused `already_approved` and the count stays one.
5. **Given** the final approval, **when** it commits, **then** the call runs once as the requester through the whole
   pipeline (permission, preconditions, entitlement, flag, validation re-checked), and the request ends `executed` or
   `failed` with the refusal code.

### US2: Expiry, rejection and withdrawal (P1)

1. **Given** a pending request past `expiresAt`, **when** anyone approves it, **then** it is refused `approval_expired`
   whether or not the sweep has run, and the sweep later marks it `expired`.
2. **Given** a pending request, **when** an approver rejects it or the requester withdraws it, **then** it is final and
   the call never runs.

### US3: Agents and the never-bypass floor (P2)

1. **Given** an agent calls a declared action in a bypass session, **when** the call runs, **then** the declared
   approvals are still required; the bypass drops only the AI `confirm` part.
2. **Given** an agent's tool call parked on a declared request, **when** the request executes on grant, **then** the
   run resumes with the executed outcome and does not dispatch the call again.

### US4: Settings keys (P3, see L-07)

1. **Given** a key marked `approval`, **when** an agent acting for the author approves the revision, **then** it is
   refused (today a plain id comparison lets it through).

### Edge cases

- **EC-001**: The approver lost the approver permission after approving, before the final approval: their approval no
  longer counts at grant time (FR-010).
- **EC-002**: The requester lost the action's permission before execution: the execution is refused `forbidden` and
  the request ends `failed` with that code.
- **EC-003**: The input stored for execution differs from the hash recorded at park: refused `approval_mismatch`.
- **EC-004**: The grant event is delivered twice: the call runs once (FR-012).
- **EC-005**: A resubmission names another tenant's, another actor's or another action's approval id: refused
  `approval_mismatch` (and the other tenant's row is invisible under RLS anyway).
- **EC-006**: The condition is false at execution (the threshold was raised): the granted call still runs; a granted
  approval is never ignored or demanded again.
- **EC-007**: A declared action with no `ApprovalGate` bound, or with `OpenApprovalGateDriver` bound: fails closed.

## Requirements

### Declaration

- **FR-001** `Action({ approval })` takes `true` (as today: a gate must be bound and decides) or an `ActionApproval`:
  `{ approvals?: number; permission: unknown; expiresAfter?: string; when?: AnyClass<ApprovalCondition> }`.
  `approvals` is the number of distinct approvers besides the requester, a whole number from 1, default 1 (four-eyes;
  see L-01). `permission` is a `Permissions` static the approver must hold in the request's scope. `expiresAfter` is
  a duration string (`"72h"`), default `"72h"`, at most 30 days (`"720h"`) (L-03). `Action()` refuses any other shape, and an
  `expiresAfter` above the maximum, at definition time (boot); gen refuses the same.
- **FR-002** `ApprovalCondition` is a new kind base: `extends ApprovalCondition` with `needed(input, ctx):
Promise<boolean>`, a binding wired by gen, file `access/<name>.approval-condition.ts`. It reads data (a setting, a
  plan value) through its constructor dependencies; the threshold is data, the comparison is code. No condition means
  every call needs approval. A condition that throws fails the call (it is not read as "not needed").
- **FR-003** Gen refuses an `expiresAfter` above 30 days, as `Action()` does at boot (L-03). A declared action needs effect tags and a permission like any action; gen refuses `approval` on a query,
  on an action whose `actors` include neither a user nor an agent (no one could request it), and on an action whose
  input schema has a field of the `credential` data class (ADR 0494).

### The stage

- **FR-004** Place: the approval step stays where it is, after validation and before idempotency, rate limit,
  interceptors, the unit of work and `handle`; under ADR 0495 it runs inside `CallIsolation.run` (it needs the tenant
  for the condition's reads and the gate's). Actions only.
- **FR-005** Decision: the pipeline computes the declared requirement (`approvals`, `permission`, expiry) when the
  condition says so, then asks the bound gate `decide(call, input, declared)`, which may add requirements from tenant
  rules and the AI resolver (the `confirm` of the person an agent acts for, a named approver for the 0360 floor) and
  never remove one. The pipeline enforces `max(declared, decided)` itself, so a driver that answers "no approval" for
  a declared call cannot let it through.
- **FR-006** Park: when approval is needed and the call names no approval id, the call is refused
  `ApprovalRequiredError` and the request is written by `gate.park(draft)` after the isolation transaction has rolled
  back, in a new `CallIsolation.run` for the same actor and scope (the pattern of the refused call's rate-limit usage
  event on the 0495 branch). With no `CallIsolation` bound, park runs after the refusal is decided, outside the unit of
  work. The refusal carries `approvalId`, `approvalsRequired` and `expiresAt`; never input.
- **FR-007** The draft records: approval id (`apr_`), action key with version, the owning service (from the
  manifest), the requester `Actor` with its `onBehalfOf` chain, tenant and scope, the input snapshot and its
  `fingerprintOf(key, input)` hash, the required approvals and approver permission, any `confirm` requirement,
  `expiresAt`, `execute: on_grant` for a declared stage or `on_resubmit` for a rules-only park, the call id, and the
  request's assurance (FR-016).
- **FR-008** Verify: a call naming `approvalId` makes the pipeline read the request (`gate.find`) and check, in core:
  same tenant and scope, same requester actor id, same action key, same input hash, status `granted`, not consumed,
  inside its execution window, and for the declared part at least `approvals` recorded votes from distinct users,
  none in the requester's chain (`approverRefusal`). Any failure is `approval_mismatch`, `approval_expired`,
  `approval_not_granted` or `approval_consumed`.
- **FR-009** Errors: `ApprovalRequiredError` gains `approvalsRequired` and `expiresAt`. New refusals, each a
  `Refusal` class in `@stackra/actions`: `ApprovalMismatchError`, `ApprovalExpiredError`, `ApprovalNotGrantedError`,
  `ApprovalConsumedError`. The approver-side refusals (`self_approval`, `already_approved`, `approver_not_permitted`,
  `step_up_required`, `seat_kind`) stay `ApproverRefusal` codes, raised by the store's approve action.

### Approve, reject, execute

- **FR-010** The store owns the approve, reject, withdraw, list and get actions (module `approvals` in OS
  tasks-approvals: `request.approve`, `request.reject`, `request.withdraw`, `request.list`, `request.get`; see L-05).
  Approve: actors `[User]` only, so no agent ever approves (L-06); the approver holds the request's approver
  permission in the request's scope, checked through `ctx.authorize(request)`; `approverRefusal` with
  `notRequester: true`; one vote per user; refused after `expiresAt`. At the vote that reaches the count, the store
  re-checks every recorded voter still holds the permission and drops those who lost it; the request becomes
  `granted` only if the count still holds.
- **FR-011** Execute on grant: for `execute: on_grant`, the grant publishes `actions.approval.granted.v1` (approval id,
  action key, owning service, tenant; nothing else) through the store's outbox in the grant's transaction. In the
  owning service, `@stackra/actions` ships `ApprovalExecutor`, a listener that loads the request, then runs the action
  through `ActionPipeline.execute` as the stored requester, with `approvalId` set, as an ADR 0495 background unit
  (isolation from the stored actor and scope). It never runs with the approver's actor or grants (0360 decision 9).
- **FR-012** Exactly once: the execution's Idempotency-Key is `approval:<approvalId>` whatever the caller sent, and
  the store moves `granted → executing → executed | failed` with `gate.settle(approvalId, outcome)` after the call
  ends; a duplicate grant delivery replays through the idempotency store, and after its TTL is refused
  `approval_consumed`. A refused execution ends `failed` with its code (final: a new request is needed); an error that
  is not a refusal leaves it `executing` for the listener's retry with the same key.
- **FR-013** Resubmission: an `on_resubmit` request (a rules-only park, as today) runs when its requester resubmits
  with the id. A resubmission of an `on_grant` request is refused `approval_consumed`; `AgentRuntime.resume` takes the
  executed outcome from the store's resume signal for an `on_grant` request and gives it to the model as the tool
  result, without dispatching again.

### Data, expiry, audit

- **FR-014** The input snapshot is stored in the request row under the tenant's RLS, like the record it will become.
  The `get` and `list` actions return it through iam field access (`redactFields`) for the viewer, so an approver sees
  only fields they may read. A field of the `credential` class never reaches the store (FR-003).
- **FR-015** Expiry is checked at every read (approve, verify) against the stored `expiresAt`; correctness never waits
  for the sweep. The store's scheduled `request.expire` job marks overdue pending requests `expired` and publishes
  `approvals.request.expired.v1`. A granted request may execute until `grantedAt + 24h` (the idempotency TTL),
  whatever its `expiresAt`.
- **FR-016** Step-up: the requester's `stepUp` is checked when the call is requested (the permission step runs before
  approval). At execution the stored assurance stands in for the requester's (L-08, pending the security-tenancy
  reviewer; if they object, the requester steps up again at execution); an approver's step-up is the
  approver rule's (`ApproverRule.stepUp`) at approve time.
- **FR-017** Audit: the request is the call's `refused` entry (`approval_required`) with fields `approvalId` and
  `inputHash`; each vote, rejection and withdrawal is the audit entry of that store action; the execution is the
  action's own entry as the requester, with fields `approvalId` and the voters' ids. Lifecycle events carry ids, key,
  counts and hash only.
- **FR-018** Floor: a declared stage composes with the 0360 floor as one request. The AI modes (`always_allow`,
  `allow_by_default`, `bypass`) may only drop the `confirm` part; no mode, setting or session lowers `approvals` below
  the declaration, and for an L3/L4 or `financial` call by an agent the floor's named approver is satisfied only by a
  vote from a user who is not in the requester's chain.

### Settings and billing

- **FR-019** `actorChainOverlaps(a, b)` in `@stackra/contracts` is the one chain check (L-07). `approverRefusal` uses
  it, and `SettingsResolver.approve` and `reject` take the deciding `Actor` instead of a string and refuse through it
  (the whole `onBehalfOf` chain), in today's settings and in the ADR 0496 rewrite alike; `SettingFourEyesError` stays
  the refusal code. Settings keep their revision model.
- **FR-020** Billing adopts the declaration on its coupon create and update actions and deletes its hand-written
  pending state, approver check and expiry (a figentra/billing change, tracked there; core's part is that FR-001 to
  FR-013 cover its case).

## Success Criteria

- **SC-001**: billing's coupon actions declare the stage and hold no approval code of their own (a grep of the billing
  coupon module finds no pending status, approver comparison or expiry).
- **SC-002**: every acceptance scenario of US1 to US3 and EC-001 to EC-007 has a test in `@stackra/actions` against the
  memory driver, and the OS driver passes the same port conformance suite.
- **SC-003**: with `OpenApprovalGateDriver` or a driver that always answers "no approval", a declared call still
  refuses (`approval_required`) or fails closed.
- **SC-004**: a parked request survives its call's rollback under `CallIsolation` (real-Postgres test with the 0495
  driver).

## Clarifications

### Session 2026-11-01 (the leader; each recommendation of the design taken, with three refinements)

- **L-01 Count semantics.** Decided 2026-11-01 by the leader: `approvals` counts distinct approvers besides the
  requester; `approvals: 1` (the default) is four-eyes. Linear's `approvers: 2` is not used.
- **L-02 Caller's answer.** Decided 2026-11-01 by the leader: the `approval_required` refusal (412) with
  `approvalId`, `approvalsRequired` and `expiresAt`; no 202-style output. Clients show the code as "sent for
  approval".
- **L-03 Expiry.** Decided 2026-11-01 by the leader: default `72h`, **maximum 30 days** (`720h`). A declaration above
  the maximum is refused by gen and at boot (`Action()` validation), so it never reaches a running pipeline.
- **L-04 Execution mode.** Decided 2026-11-01 by the leader: declared stages execute on grant; requests parked only by
  tenant rules keep resubmission for now.
- **L-05 Store owner.** Decided 2026-11-01 by the leader: OS tasks-approvals owns the table, the approve, reject,
  withdraw, list and get actions and the sweep; core owns the port, the stage, the checks, the executor, the memory
  driver and the conformance suite.
- **L-06 Approvers.** Decided 2026-11-01 by the leader: approve actions take user actors only; an agent never
  approves, whoever's call it is.
- **L-07 Settings.** Decided 2026-11-01 by the leader: settings keep their revision model and adopt the chain check,
  **shared with the ADR 0496 settings rewrite, not forked**. The one function both use is
  `actorChainOverlaps(a: Actor, b: Actor): boolean` in `@stackra/contracts`
  (`packages/foundation/contracts/src/core/functions/actor-chain-overlaps.function.ts`): true when any principal id in
  `a`'s `onBehalfOf` chain is in `b`'s. It sits beside `Actor` in the foundation package because settings becomes a
  foundation package under 0496 and may not import `@stackra/actions`. `approverRefusal` (actions) and
  `SettingsResolver.approve` (settings) both call it; neither keeps its own chain walk.
- **L-08 Step-up at execution.** Decided 2026-11-01 by the leader, **pending the security-tenancy reviewer**: the
  requester's step-up at request time stands and the fresh factor is the approvers' step-up. If the reviewer objects,
  the requester steps up again at execution: the executor parks the executed call on a step-up prompt to the
  requester instead of running it with the stored assurance (FR-016 changes; a new task follows the review).
- **L-09 Grant delivery.** Decided 2026-11-01 by the leader: the `actions.approval.granted.v1` integration event,
  defined in `@stackra/actions` and published by the store.
- **L-10 Single-operator installs.** Decided 2026-11-01 by the leader: a declared four-eyes action cannot complete
  with one human, on every deploy mode; no override.

## Security notes (for the reviewer)

- **Input tampering.** The hash is taken over the validated input at park and compared with the validated input at
  execution (FR-008). A database writer can change snapshot and hash together; the hash is also in the `refused` audit
  entry (hash-chained, ADR 0212) and in `approvals.request.requested.v1`, and the store shows approvers the hash, so a
  change is detectable. An HMAC over the row is possible later (not designed here).
- **Replay.** An approval id is bound to tenant, scope, requester, key and hash; consumed once (FR-012); refused after
  its window (FR-015).
- **Tenant isolation.** The store rows are tenant-owned with FORCE RLS; the approve and list actions run in the
  approver's tenant; the executor runs in the stored actor's isolation (0495 decision 2), never the platform's.
- **Lost permission.** Voters are re-checked at grant (FR-010); the requester's permission, preconditions,
  entitlement and flag are re-checked at execution because the execution is a full pipeline call (EC-002).
- **Authority.** The execution runs as the requester; the approver's grants never reach it (0360 decision 9).
- **Fail closed.** No gate, the open gate, or a driver answering "no approval" cannot skip a declared stage (FR-005,
  SC-003).

## Not built here

- The OS tasks-approvals driver, table, actions, sweep and inbox UI (OS repository).
- Billing's adoption (figentra/billing#2).
- An HMAC over stored requests.

## Status history

- 2026-10-31 · — → Draft · Claude (spec-writer) · from STA-1724 and the lead's brief; design for approval
- 2026-11-01 · Draft → Clarified · Claude (spec-writer) · the leader approved L-01 to L-10 as recommended, with the
  30-day expiry maximum, the shared `actorChainOverlaps` and L-08 pending the security-tenancy reviewer
