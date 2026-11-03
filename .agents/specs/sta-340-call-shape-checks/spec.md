# Feature Specification: Call-shape refusals in gen

**Feature Branch**: `figentra/sta-340-call-shape-checks`

**Created**: 2026-11-03

**Status**: Draft

**Tier**: feature

**Approver**: owner

**Linear**: STA-340

**Linear project**: none

**Clarifications status**: complete (owner answer to Q-001, 2026-11-03, below)

**Analyze**: —

**Input**: User description: "Work package wp-17 of the gen coverage path: refuse a query above L1, a precondition on a
query, `cache` on an action, an L3 or L4 user action without `stepUp`, and a client write with no idempotency
declaration (gaps G-63, G-64, H-16 and the gen half of G-138)."

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: apps/playground (its committed manifest hosts identity and privacy actions; regenerated only)
- **Services touched**: none
- **Packages touched**: packages/developer/gen (the check); packages/application/actions (the pipeline asks for
  step-up only from a user caller, Q-001 option A); the packages whose action classes the check refuses today:
  packages/security/identity, packages/security/privacy, packages/security/access-log, packages/commerce/loyalty-kit,
  packages/data/data-maintenance, packages/data/media, packages/experience/collaboration
- **Public contract change**: additive: five new gen refusal codes (`query_above_l1`, `query_precondition`,
  `action_cache`, `step_up_missing`, `idempotency_missing`); fixed classes gain an `idempotency` entry, and the three
  mixed-actor classes a `stepUp`, in their committed `stackra.manifest.json`. Behaviour: an action's `stepUp` no longer
  applies to a service, job, system or agent caller
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: step-up: every L3 and L4 action a user can call must declare `stepUp` (ADR 0207 decision 1,
  ADR 0406); the pipeline checks it for user callers only, so service callers such as `ops bootstrap-operator` keep
  working. A user call to one of the three fixed classes now needs a bound `StepUpCheck` (fails closed, ADR 0406
  decision 4)
- **Secrets**: none
- **ADR needed**: no new ADR; ADR 0406 (Proposed) takes a dated amendment of decision 3 recording the owner's answer
  (the check runs for a user caller only). The rules are ADR 0136 decision 3, ADR 0207 decision 1, ADR 0406 and the
  http-conventions table
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `.agents/rules/http-conventions.md` (Enforcement: the STA-340 rows this ships move from planned
  to enforced); `apps/docs/src/docs/adr/0136-action-runtime-contract.mdx` and `0207` Enforcement lines; `0406`
  amendment; `packages/developer/gen/README.md` code list
- **Lane**: full
- **Change risk**: R2 (gen refuses classes that pass today; security-relevant step-up rule changes who is asked)

## Glossary _(full lane)_

- **Call shape**: the options an action or query declares that decide how a call is made: its kind, risk, actors,
  `preconditions`, `cache`, `stepUp` and `idempotency`.
- **Client write**: an action a client can call: one that gen gives an endpoint (its actors include a user or an
  agent and it does not say `endpoint: false`) or that is an MCP tool.
- **User caller**: a call whose actor kind is `ActorKind.User`.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Gen refuses a misshapen call (Priority: P1)

An author writes an action or query whose options contradict the action rules. Today it passes gen and the mistake is
found at runtime or never. After this change gen refuses it with a code and the fix.

**Why this priority**: the rules are written (ADR 0136, 0207, 0406, http-conventions) but only review enforces them.

**Independent Test**: a fixture per refusal in
`packages/developer/gen/src/core/functions/__tests__/check-call-shape.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** a query whose permission is L2, **When** gen runs, **Then** it refuses `query_above_l1`.
2. **Given** a query with `preconditions`, **When** gen runs, **Then** it refuses `query_precondition`.
3. **Given** an action with `cache`, **When** gen runs, **Then** it refuses `action_cache`.
4. **Given** an L3 action whose actors include `User` and no `stepUp`, **When** gen runs, **Then** it refuses
   `step_up_missing`.
5. **Given** an action with an endpoint and no `idempotency`, **When** gen runs, **Then** it refuses
   `idempotency_missing`.

---

### User Story 2 - Step-up asks only a user (Priority: P1)

An L3 or L4 action that both users and services call declares `stepUp`. A user's call is checked for a recent strong
authentication; a service's call (the `ops bootstrap-operator` CLI, a job) carries no assurance and is not asked.

**Why this priority**: without it, the `step_up_missing` fix would refuse every service caller of the three mixed-actor
classes `step_up_required`.

**Independent Test**: `packages/application/actions/src/core/services/__tests__/action-pipeline.service.test.ts`.

**Acceptance Scenarios**:

1. **Given** an action with `stepUp: AssuranceLevel.Aal2` and a service caller, **When** it runs with no
   `StepUpCheck` bound, **Then** it runs and no step-up is asked.
2. **Given** the same action and a user caller, **When** it runs, **Then** `StepUpCheck` is asked, and with none bound
   the call fails closed as today.

---

### Edge Cases

- **EC-01**: a query whose permission is unknown (`permission_unknown`) is not also refused `query_above_l1`.
- **EC-02**: an L3 or L4 action whose actors include no user (service, job, system only) is not refused
  `step_up_missing`.
- **EC-03**: an action with `endpoint: false` that is not a tool, or a job-only action, is not refused
  `idempotency_missing` (jobs, events and workflow steps derive their own keys, ADR 0136 decision 3).
- **EC-04**: `idempotency: Idempotency.Optional` written out is a declaration and passes (ADR 0136 Enforcement: "no
  idempotency declaration").
- **EC-05**: an agent caller of a `stepUp` action is not asked for step-up (owner answer: user callers only); its
  approval rules stay ADR 0360's.
- **EC-06**: an approved call (an `approvalId` binding) by a user still stands on the assurance its binding recorded
  (ADR 0509, unchanged).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: IF a query's permission risk is L2, L3 or L4 THEN gen SHALL refuse `query_above_l1`.
- **FR-002**: IF a query declares `preconditions` THEN gen SHALL refuse `query_precondition`.
- **FR-003**: IF an action declares `cache` THEN gen SHALL refuse `action_cache`.
- **FR-004**: IF an action's risk is L3 or L4, its actors include `User` and it declares no `stepUp` THEN gen SHALL
  refuse `step_up_missing`.
- **FR-005**: IF an action is a client write and declares no `idempotency` THEN gen SHALL refuse
  `idempotency_missing`.
- **FR-006**: THE check SHALL be one pure function, `checkCallShape`, called once per action or query from the action
  entry block of `buildManifest`, and each refusal SHALL carry its fix (ADR 0294 decision 22).
- **FR-007**: THE committed manifests and the gen golden fixtures SHALL stay green: each class the check refuses today
  is fixed in the same change.
- **FR-008**: WHEN an action declares `stepUp` THE actions pipeline SHALL ask `StepUpCheck` only IF the caller's actor
  kind is `ActorKind.User`.
- **FR-009**: `identity.operator.bootstrap`, `identity.session.end_user` and `privacy.hold.release` SHALL declare
  `stepUp: AssuranceLevel.Aal2`.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: IF a fixture query is L2 THEN gen SHALL report `query_above_l1`.
- **AC-002**: IF a fixture query has `preconditions` THEN gen SHALL report `query_precondition`.
- **AC-003**: IF a fixture action has `cache` THEN gen SHALL report `action_cache`.
- **AC-004**: IF a fixture L3 user action has no `stepUp` THEN gen SHALL report `step_up_missing`, and an L3 service-only
  action SHALL pass.
- **AC-005**: IF a fixture action with an endpoint has no `idempotency` THEN gen SHALL report `idempotency_missing`.
- **AC-006**: THE gen golden tests and `stackra gen --check` over every committed manifest SHALL pass.
- **AC-007**: IF a service calls a `stepUp` action with no `StepUpCheck` bound THEN the pipeline SHALL run it, and IF a
  user calls it THEN the pipeline SHALL still ask `StepUpCheck`.

## Success Criteria _(mandatory)_

- **SC-001**: each of the five codes refuses its fixture — verified by: unit
- **SC-002**: the gen golden suite and the committed manifests are unchanged except for the fixed classes' entries —
  verified by: unit (golden) and `stackra gen --check` on ci-box
- **SC-003**: a service caller of a `stepUp` action is never asked for step-up, a user caller always is — verified by:
  unit (actions pipeline)

## Out of scope

- The SDK half of G-138 (the SDKs creating the Idempotency-Key): wp-07.
- Refusal lists for entitlement, interceptor and step-up refusals: wp-64.
- Binding a `StepUpCheck` driver in any app or service.
- Splitting the three mixed-actor classes into user and service actions (Q-001 option B, not chosen).

## Assumptions

- A written `Idempotency.Optional` is a declaration (the enum's own contract and ADR 0136 Enforcement), so the fix for
  an undeclared client write that is safe to repeat is to write the policy it already has.
- The query above L1 and `cache`/`preconditions` refusals have no offender among the committed manifests today
  (surveyed 2026-11-03: 78 entries in 131 manifests).
- `identity.operator.bootstrap`'s system permission refuses every user before the step-up step, so its user route keeps
  refusing `forbidden`, not `step_up_required`.

## Clarifications

### Session 2026-11-03

- **Q-001** (owner): `identity.operator.bootstrap` (L4), `identity.session.end_user` (L3) and `privacy.hold.release`
  (L4) list both `ActorKind.User` and `ActorKind.Service` and declare no `stepUp`; the pipeline applied `stepUp` to
  every caller, and a service or job call carries no assurance (ADR 0406 decision 1). → **A**: the actions pipeline
  applies `stepUp` only when the caller is a user (`ActorKind.User`); gen refuses every L3 or L4 action whose actors
  include `User` and that declares no `stepUp` (`step_up_missing`); the three classes add
  `stepUp: AssuranceLevel.Aal2`, so service callers such as `ops bootstrap-operator` keep working. The pipeline change
  and its test ship in this package (FR-008, FR-009, AC-007).

## Amendments

None.

## Status history

- 2026-11-03 · — → Draft · agent (wp-17) · created; blocked on Q-001
- 2026-11-03 · Draft → Draft · agent (wp-17) · owner answered Q-001 with option A; pipeline change added
