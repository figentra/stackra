# Feature Specification: Declarative approval stage (second approver, four-eyes) in the action pipeline

**Feature Branch**: `figentra/sta-1724-approval-stage`

**Created**: 2026-10-31

**Status**: Clarified <!-- design approved by the leader 2026-11-01; security-tenancy re-review PASS WITH CHANGES applied; nothing is built -->

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
- **Packages touched**: packages/application/actions (option, ports, stage, kind base, executor, memory drivers,
  errors, event), packages/security/tenancy (the `ApprovalBinding` model, its migration and the Postgres
  `ApprovalBindingStore` driver), packages/security/identity (the `personOf` driver, C4), packages/application/ai (`AgentRuntime.resume` for an executed request), packages/state/settings
  (the approver check uses the shared chain function; see L-07), packages/foundation/contracts
  (`actorChainOverlaps`, `actorsSharePerson`, `IdentityResolver.personOf`)
- **Cross-service events**: new `actions.approval.granted.v1` (published by the store's service, consumed by the
  service that owns the action; ids only); the store's own lifecycle events `approvals.request.requested.v1`,
  `.approved.v1`, `.rejected.v1`, `.expired.v1`, `.executed.v1` (OS; ids, key and counts only: no input and no input
  hash, which is an unkeyed SHA-256 over low-entropy input; S11)
- **Tenancy and data**: one new tenant-owned table in the OS tasks-approvals module (`approvals.approval_requests` and
  `approvals.approval_votes`), `tenant_id` with FORCE RLS from the scoped-table pattern; holds an input snapshot
  (data-class rules in FR-014). And one tenant-owned table in **every service that owns a declared action**: the
  approval binding (FR-007), `tenant_id` with FORCE RLS, no secret (the leader chose this over a per-service MAC key).
  `@stackra/tenancy` ships its model (`src/node/models/approval-binding.model.ts`, `BelongsToTenant`) and its migration
  (`src/node/database/migrations/<n>-create-approval-bindings.migration.ts`, table `tenancy.approval_bindings`) behind
  the `ApprovalBindingStore` port that `@stackra/actions/contracts` declares: tenancy, not actions, because actions
  sits below tenancy and cannot use `BelongsToTenant`. The memory drivers are for tests and single-process dev
- **Secrets**: none
- **ADR needed**: yes, draft 0509 (Proposed) in this change; it amends 0098 decision 3, 0397 decision 5, 0207 decision 1 (for approved calls, FR-016 (d)) and the
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
- **EC-007**: A declared action with no `ApprovalGate`, or with `OpenApprovalGateDriver`, or with no
  `ApprovalBindingStore` bound: fails closed.
- **EC-008**: A store row with a changed actor, tenant, scope, key or input snapshot: the execution is refused
  `approval_mismatch` (B1).
- **EC-009**: The requester's second `usr_` id in another realm votes: refused `self_approval`; identity unreachable:
  the vote is refused (FR-022).

## Requirements

### Declaration

- **FR-001** `Action({ approval })` takes `true` (as today: a gate must be bound and decides) or an `ActionApproval`:
  `{ approvals?: number; permission: unknown; expiresAfter?: string; when?: AnyClass<ApprovalCondition> }`.
  `approvals` is the number of distinct approvers besides the requester, a whole number from 1, default 1 (four-eyes;
  see L-01). `permission` is a `Permissions` static the approver must hold in the request's scope. `expiresAfter` is
  a duration string (`"72h"`), default `"72h"`, at most 30 days (`"720h"`) (L-03). `Action()` refuses any other shape, and an
  `expiresAfter` above the maximum, at definition time (boot); gen refuses the same.
- **FR-002** `ApprovalCondition` is a new kind base: `extends ApprovalCondition` with `needed(input, ctx, settings):
Promise<boolean>`, a binding wired by gen, file `access/<name>.approval-condition.ts`. The threshold is data, the
  comparison is code. No condition means every call needs approval. A condition that throws fails the call (it is not
  read as "not needed"). A condition lists the settings keys it reads in a static `reads` array, and each must itself
  be a key marked `approval` (S9), so a threshold cannot be lowered without a second person. It receives a settings
  reader limited to that list as an argument, `needed(input, ctx, settings)`, which throws on any key not listed (N2); it
  takes no constructor dependencies, and gen refuses any constructor dependency and any `reads` key not marked
  `approval` (an allow-list for platform plan and entitlement values opens when those classes exist). The source behind the reader is the `ApprovalSettingsSource` port in `@stackra/contracts`, and `@stackra/settings` ships its driver; a condition that declares `reads` with none bound is refused `approval_settings_unavailable`.
- **FR-003** Gen refuses an `expiresAfter` above 30 days, as `Action()` does at boot (L-03). A declared action needs
  effect tags and a permission like any action. Gen refuses `approval` on a query, on an action whose input schema has
  a field of the `credential` data class (ADR 0494), and unless every entry of `actors` is `User`, `Agent` or
  `ExternalAgent` (N3: an allow-list, so a new actor kind is refused until it is reviewed). The runtime check that the
  chain's root is a user stays (FR-006).

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
  work. The refusal carries `approvalId`, `approvalsRequired` and `expiresAt`; never input. Before it parks, the
  runtime refuses (`forbidden`) a call whose `onBehalfOf` chain does not end at a `User` (S8), and the park takes a
  token from the action's rate-limit bucket before the binding is inserted (S10, N8), so a refused token writes
  nothing; the store refuses a park beyond its cap of pending requests per
  requester per action with `approval_pending_limit`. A park that fails is logged by approval id, key and error code
  only, never the draft or its input (C3).
- **FR-007** Two records, written in the park's fresh `CallIsolation.run` (B1):
  - The **binding**, in the owning service, through `ApprovalBindingStore` (the table in the Impact): approval id
    (`apr_`), tenant and scope, the requester `Actor` with its whole `onBehalfOf` chain, the action key with version,
    `inputHash = fingerprintOf(key, validated input)`, the requester's assurance (level and `authTime`), `requestedAt`
    and `expiresAt` by the owning service's clock, the required approvals, approver permission and approver assurance
    level (N6), any `confirm` requirement and the execution mode. It is the only source of who, where, what and when
    for an execution. It is insert-only (N7): the pipeline inserts it, and only `PruneApprovalBindingsAction`
    (`approval_binding.prune`, a daily job in `@stackra/tenancy`) deletes it, a binding once its `expiresAt` + 24
    hours (the execution tail) + `AUDIT_HOT_RETENTION` (`@stackra/contracts`, ADR 0212's thirteen months) has passed. Nothing updates it, and nothing but
    the pipeline, the executor and that job reads or writes it. The actor chain and the input hash are listed in the
    owning service's PII table and in the model's docs.
  - The **draft**, in the store, through `gate.park`: the same approval id, key, tenant, scope and requester for
    display and voting, the input snapshot, the requirements with the approver assurance level (N6), `expiresAt`, and
    `execute: on_grant` for a declared
    stage or `on_resubmit` for a rules-only park. Nothing the store holds decides the identity, scope or input of an
    execution.
    The binding is written first; if the park then fails, the binding is left unused and expires.
- **FR-008** Verify: a call naming `approvalId` makes the pipeline read the binding (`ApprovalBindingStore`) and the
  request (`gate.find`) and check, in core: the binding exists in the call's tenant (RLS) and names the call's scope,
  requester actor id and chain, and action key; the hash of the call's validated input equals the binding's
  `inputHash`, and for an execution the store's snapshot hashes to it too (B1); the store's status is `granted`, or
  `executing` under this same execution key (its own retry, S3); the execution window by the binding's clock
  (FR-015); at least the binding's `approvals` votes from distinct people, none of them the requester's person
  (FR-022); the requester is active and every agent delegation in the chain is unrevoked and unexpired (S6). Any
  failure is `approval_mismatch`, `approval_expired`, `approval_not_granted` or `approval_consumed`. A store row
  whose actor, tenant, scope, key or input differs from the binding is refused `approval_mismatch`.
- **FR-009** Errors: `ApprovalRequiredError` gains `approvalsRequired` and `expiresAt`. New refusals, each a
  `Refusal` class in `@stackra/actions`: `ApprovalMismatchError`, `ApprovalExpiredError`, `ApprovalNotGrantedError`,
  `ApprovalConsumedError`, `ApprovalPendingLimitError`. A caller-sent Idempotency-Key that starts with `approval:` is
  refused `input_invalid` (C1). The approver-side refusals (`self_approval`, `already_approved`, `approver_not_permitted`,
  `step_up_required`, `seat_kind`) stay `ApproverRefusal` codes, raised by the store's approve action.

### Approve, reject, execute

- **FR-010** The store owns the approve, reject, withdraw, list and get actions (module `approvals` in OS
  tasks-approvals: `request.approve`, `request.reject`, `request.withdraw`, `request.list`, `request.get`; see L-05).
  Approve: actors `[User]` only, so no agent ever approves (L-06); the approver holds the request's approver
  permission in the request's scope, checked through `ctx.authorize(request)`; `approverRefusal` with
  `notRequester: true`, then the person check of FR-022 (`self_approval` when the voter is the requester's person, a
  refused vote when identity cannot answer); one vote per person, so two `usr_` ids of one human count once; refused after `expiresAt`. At the vote that reaches the count, the store
  re-checks every recorded voter is active, still holds the permission and passes `approverRefusal` and the person
  check again, and drops those who fail; the request becomes `granted` only if the count still holds (S6). Approve,
  reject and withdraw are `tool: false` with a `// reason:` (a person decides, never a model; S7), and a vote from an
  operator-access session (ADR 0188) is refused `forbidden`. A vote from a user of the customer realm is refused
  `forbidden`, and every vote records the voter's realm (N4). The store refuses a vote whose session is below the
  request's approver assurance level with `step_up_required` (N6). Reject and withdraw act only on a `pending` request
  (S3).
- **FR-011** Execute on grant: for `execute: on_grant`, the grant publishes `actions.approval.granted.v1` (approval id,
  action key, owning service, tenant; nothing else) through the store's outbox in the grant's transaction. In the
  owning service, `@stackra/actions` ships `ApprovalExecutor`, a listener that acts only on an envelope from the
  store's service and never lets the inbox's actor reach a call context (S5). It runs in two isolation runs (N1):
  - **Read.** It reads the binding inside a `CallIsolation.run` for the event's tenant, as the system actor in that
    scope (the scheduler pattern of ADR 0495 decision 2). That read is never a platform read and never uses
    `BYPASSRLS`; a binding outside that tenant is invisible, and the event is dropped.
  - **Run.** It builds the call only from the binding (actor and chain, scope, key, assurance), takes status, votes
    and the input snapshot from the store, refuses `approval_mismatch` when the snapshot does not hash to the
    binding's `inputHash` (B1), checks `ScopeOwnership` for the stored actor and scope (S5), moves the store
    `granted → executing` by compare-and-set (S3), then opens a separate, fresh `CallIsolation.run` as the binding's
    actor and runs `ActionPipeline.execute` with `approvalId` set.
    It never runs with the approver's actor or grants (0360 decision 9).
- **FR-012** Exactly once: the execution's Idempotency-Key is `approval:<approvalId>` whatever the caller sent (callers
  may not use the `approval:` prefix, C1). `gate.settle(approvalId, outcome)` is a compare-and-set from `executing` to
  `executed` or `failed` (S1). A duplicate or concurrent delivery replays through the idempotency store; an
  `idempotency_key_reused` or `approval_consumed` answer to the executor means "in flight" and never settles `failed`
  (S1, S2). A refused execution ends `failed` with its code (final: a new request is needed); an error that is not a
  refusal leaves it `executing` for the listener's retry with the same key. An identity outage at execution, in the
  person, active, delegation or FR-016 (e) check, is such a retryable error: the request stays `executing` and never
  ends `failed` on it (N5). A request still `executing` 24h after its
  grant moves to `unknown`, which the store shows to operators and never retries (S2).
- **FR-013** Resubmission: an `on_resubmit` request (a rules-only park, as today) runs when its requester resubmits
  with the id. A resubmission of an `on_grant` request is refused `approval_consumed`; `AgentRuntime.resume` takes the
  executed outcome from the store's resume signal for an `on_grant` request and gives it to the model as the tool
  result, without dispatching again.

### Data, expiry, audit

- **FR-014** The input snapshot is stored in the request row under the tenant's RLS, like the record it will become.
  The `get` and `list` actions return it through iam field access (`redactFields`) for the viewer, so an approver sees
  only fields they may read. `get` and `list` show a request only to a viewer who holds its approver permission in its
  scope or is in its requester's chain (S4). A field of the `credential` class never reaches the store (FR-003). At a
  final state (`executed`, `failed`, `rejected`, `withdrawn`, `expired`, `unknown`) the store deletes the snapshot and
  keeps ids, key and counts; the snapshot column is listed in the OS service's PII table (C2).
- **FR-015** Expiry is checked at every read (approve, verify) against the stored `expiresAt`; correctness never waits
  for the sweep. The store's scheduled `request.expire` job marks overdue pending requests `expired` and publishes
  `approvals.request.expired.v1`. A granted request may execute until `grantedAt + 24h` (the idempotency TTL),
  whatever its `expiresAt`. Every window is measured by the owning service's clock from the binding's `requestedAt`
  and `expiresAt` (S3), never by the store's timestamps alone.
- **FR-016** Step-up (L-08, confirmed by the security-tenancy reviewer with conditions, B2). The requester's `stepUp`
  is checked when the call is requested (the permission step runs before approval). At execution the stored
  assurance stands in for the requester's, under five conditions:
  - (a) the assurance comes from the binding (FR-007), never from the store or the event;
  - (b) `StepUpCheck` at execution is evaluated against the binding's `requestedAt` and applies to that one call
    only, never to calls it makes (`ctx.dispatch`, `ctx.run`) or to a resumed agent run;
  - (c) for an action that declares `stepUp`, and for every L3 or L4 action, each approver steps up at vote time,
    whatever the tenant's `ApproverRule.stepUp` says; the required approver assurance level is in the draft and the
    binding (FR-007), and the store enforces it on each vote (N6);
  - (d) this amends ADR 0207 decision 1 for approved calls only: the 10-minute step-up window of an L3 or L4 action is
    measured at the request, and the approvers' fresh step-up stands for the rest;
  - (e) the execution is refused `step_up_required` when the requester's sessions were revoked or their factors reset
    after `requestedAt`, read through an identity query "sessions revoked or factors reset since T" (N5; a dependency
    on identity).
- **FR-017** Audit: the request is the call's `refused` entry (`approval_required`) with fields `approvalId` and
  `inputHash`; each vote, rejection and withdrawal is the audit entry of that store action; the execution is the
  action's own entry as the requester, with fields `approvalId` and the voters' ids. Lifecycle events carry ids, key
  and counts only; the input hash stays in the binding and the audit trail, never on a cross-service event (S11).
- **FR-018** Floor: a declared stage composes with the 0360 floor as one request. The AI modes (`always_allow`,
  `allow_by_default`, `bypass`) may only drop the `confirm` part; no mode, setting or session lowers `approvals` below
  the declaration, and for an L3/L4 or `financial` call by an agent the floor's named approver is satisfied only by a
  vote from a user who is not in the requester's chain.

- **FR-021** The store's states (S3): `pending → granted | rejected | withdrawn | expired`; `granted → executing` by
  compare-and-set before the pipeline runs; `executing → executed | failed | unknown`. Reject and withdraw act only on
  `pending`; every other state is final. The memory driver and the conformance suite hold this table.
- **FR-022** One person, several ids (C4, decided by the leader 2026-11-01). One human may hold several `usr_` ids in a
  tenant across realms, and `Actor` carries only an id and a realm. `actorChainOverlaps` stays the pure id check. The
  self-approval and chain refusal also run a person check, `actorsSharePerson(identity, a, b)` in `@stackra/contracts`
  (`packages/foundation/contracts/src/core/functions/actors-share-person.function.ts`): true when the chains overlap by
  id, or when any `usr_` id of one chain and any of the other are the same person. Two ids are the same person when
  `IdentityResolver.personOf(usr)` (a new port method returning a stable person or verified-identity key; identity's
  requirement, routed through the leader) answers the same key; until it exists, when their verified email or
  verified phone is equal (`principalOf`). When the resolver is unavailable or cannot answer, the vote is refused
  (fail closed). The store's approve (FR-010), core's verify (FR-008) and settings' approve (FR-019) all use it.

### Settings and billing

- **FR-019** `actorChainOverlaps(a, b)` in `@stackra/contracts` is the one chain check (L-07). `approverRefusal` uses
  it, and `SettingsResolver.approve` and `reject` take the deciding `Actor` instead of a string and refuse through it
  (the whole `onBehalfOf` chain), then through `actorsSharePerson` (FR-022), in today's settings and in the ADR 0496
  rewrite alike; `SettingFourEyesError` stays
  the refusal code. Settings keep their revision model.
- **FR-020** Billing adopts the declaration on its coupon create and update actions and deletes its hand-written
  pending state, approver check and expiry (a figentra/billing change, tracked there; core's part is that FR-001 to
  FR-013 cover its case).

## Success Criteria

- **SC-001**: billing's coupon actions declare the stage and hold no approval code of their own (a grep of the billing
  coupon module finds no pending status, approver comparison or expiry).
- **SC-002**: every acceptance scenario of US1 to US3 and EC-001 to EC-009 has a test in `@stackra/actions` against the
  memory driver, and the OS driver passes the same port conformance suite.
- **SC-003**: with `OpenApprovalGateDriver` or a driver that always answers "no approval", a declared call still
  refuses (`approval_required`) or fails closed.
- **SC-004**: a parked request survives its call's rollback under `CallIsolation` (real-Postgres test with the 0495
  driver).

## Clarifications

### Session 2026-11-01 (the leader; each recommendation taken, with three refinements; then the security-tenancy review of 5c5a3c75 folded in, with the leader's decisions on it)

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
- **L-08 Step-up at execution.** Decided 2026-11-01 by the leader; **confirmed with conditions** by the
  security-tenancy reviewer on 2026-11-01 (B2), and the conditions accepted in full by the leader: the stored assurance
  from the binding stands at execution under the five conditions of FR-016, which amend ADR 0207 decision 1 for
  approved calls.
- **L-09 Grant delivery.** Decided 2026-11-01 by the leader: the `actions.approval.granted.v1` integration event,
  defined in `@stackra/actions` and published by the store.
- **Review B1.** Decided 2026-11-01 by the leader: the per-service tenant-owned FORCE RLS binding table; no MAC key.
- **Review C4.** Decided 2026-11-01 by the leader: a requirement, not an open question (FR-022).
- **L-10 Single-operator installs.** Decided 2026-11-01 by the leader: a declared four-eyes action cannot complete
  with one human, on every deploy mode; no override.

## Security notes

- **Input tampering and a forged store row (B1).** Identity, scope, key, hash, assurance and times come from the
  binding in the owning service's own tenant table; the store supplies only status, votes and the snapshot, and a
  snapshot that does not hash to the binding is refused. A writer of the store's table can no longer run an action as
  someone else, elsewhere, or on other input. The hash is also in the `refused` audit entry (hash-chained, ADR 0212),
  never on a cross-service event (S11).
- **One person, two ids (C4, N4).** The person check of FR-022 refuses a vote by the requester's other id and fails
  closed when identity cannot answer. The interim rule (equal verified email or phone) catches the accidental case,
  not a deliberate second account with other contact details. Until the person link (STA-1741) exists, the control
  is provisioning: a staff account comes only from an audited admin invitation. A customer-realm user can never vote,
  and each vote records the voter's realm.
- **Replay.** An approval id is bound to tenant, scope, requester, key and hash; consumed once (FR-012); refused after
  its window (FR-015).
- **Tenant isolation.** The store rows are tenant-owned with FORCE RLS; the approve and list actions run in the
  approver's tenant; the executor runs in the stored actor's isolation (0495 decision 2), never the platform's.
- **Lost permission.** Voters are re-checked at grant (FR-010); the requester's permission, preconditions,
  entitlement and flag are re-checked at execution because the execution is a full pipeline call (EC-002).
- **Authority.** The execution runs as the requester; the approver's grants never reach it (0360 decision 9).
- **Fail closed.** No gate, the open gate, or a driver answering "no approval" cannot skip a declared stage (FR-005,
  SC-003).

## Dependencies

| Dependency                           | Needed for                                                                   | Route             |
| ------------------------------------ | ---------------------------------------------------------------------------- | ----------------- |
| identity: person link                | `IdentityResolver.personOf(usr)` and its driver (FR-022, STA-1741)           | routed via leader |
| identity: session and factor history | "sessions revoked or factors reset since T" for a `usr_` id (FR-016 (e), N5) | routed via leader |
| ADR 0495 (`CallIsolation`)           | park and execution isolation (FR-006, FR-011)                                | STA-1699          |
| OS tasks-approvals store             | the store driver, actions and sweep (FR-010, FR-021)                         | OS repository     |

## Not built here

- The OS tasks-approvals driver, table, actions, sweep and inbox UI (OS repository).
- Billing's adoption (figentra/billing#2).
- An HMAC over stored requests.

## Status history

- 2026-10-31 · — → Draft · Claude (spec-writer) · from STA-1724 and the lead's brief; design for approval
- 2026-11-01 · Draft → Clarified · Claude (spec-writer) · the leader approved L-01 to L-10 as recommended, with the
  30-day expiry maximum, the shared `actorChainOverlaps` and L-08 pending the security-tenancy reviewer
- 2026-11-01 · Clarified (unchanged) · Claude (spec-writer) · the security-tenancy review of 5c5a3c75 (BLOCK) folded
  in with the leader's decisions: the owning-service binding (B1), the step-up conditions (B2), S1 to S11, C1 to C3,
  and the person check (C4, FR-022)
- 2026-11-01 · Clarified (unchanged) · Claude (spec-writer) · the re-review of a154625b (PASS WITH CHANGES) applied:
  N1 to N8 and the stale text; C5 left to ADR 0495 (STA-1699)
