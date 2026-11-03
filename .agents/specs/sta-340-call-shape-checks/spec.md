# Feature Specification: Call-shape refusals in gen

**Feature Branch**: `figentra/sta-340-call-shape-checks`

**Created**: 2026-11-03

**Status**: Draft

**Tier**: feature

**Approver**: owner

**Linear**: STA-340

**Linear project**: none

**Clarifications status**: pending

**Analyze**: —

**Input**: User description: "Work package wp-17 of the gen coverage path: refuse a query above L1, a precondition on a
query, `cache` on an action, an L3 or L4 user action without `stepUp`, and a client write with no idempotency
declaration (gaps G-63, G-64, H-16 and the gen half of G-138)."

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: apps/playground (its committed manifest hosts identity and privacy actions; regenerated only)
- **Services touched**: none
- **Packages touched**: packages/developer/gen (the check); the packages whose action classes the check refuses today:
  packages/security/identity, packages/security/privacy, packages/security/access-log, packages/commerce/loyalty-kit,
  packages/data/data-maintenance, packages/data/media, packages/experience/collaboration; and, depending on Q-001,
  packages/application/actions
- **Public contract change**: additive: five new gen refusal codes (`query_above_l1`, `query_precondition`,
  `action_cache`, `step_up_missing`, `idempotency_missing`); fixed classes gain an `idempotency` entry in their
  committed `stackra.manifest.json`
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: step-up: L3 and L4 user actions must declare `stepUp` (ADR 0207 decision 1, ADR 0406); see
  Q-001 for actions that services also call
- **Secrets**: none
- **ADR needed**: no (the rules are ADR 0136 decision 3, ADR 0207 decision 1, ADR 0406 and the http-conventions table;
  Q-001 may need an amendment of ADR 0406 if the owner picks option A)
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `.agents/rules/http-conventions.md` (Enforcement: the STA-340 rows this ships move from planned
  to enforced), apps/docs/src/docs/adr/0136-action-runtime-contract.mdx and 0207 Enforcement lines
- **Lane**: full
- **Change risk**: R2 (gen refuses classes that pass today; security-relevant step-up rule)

## Glossary _(full lane)_

- **Call shape**: the options an action or query declares that decide how a call is made: its kind, risk, actors,
  `preconditions`, `cache`, `stepUp` and `idempotency`.
- **Client write**: an action a client can call: one that gen gives an endpoint (its actors include a user or an
  agent and it does not say `endpoint: false`) or that is an MCP tool.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Gen refuses a misshapen call (Priority: P1)

An author writes an action or query whose options contradict the action rules. Today it passes gen and the mistake is
found at runtime or never. After this change gen refuses it with a code and the fix.

**Why this priority**: the rules are written (ADR 0136, 0207, 0406, http-conventions) but only review enforces them.

**Independent Test**: a fixture member per refusal in
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

### Edge Cases

- **EC-01**: a query whose permission is unknown (`permission_unknown`) is not also refused `query_above_l1`.
- **EC-02**: an L3 or L4 action whose actors include no user (service, job, system only) is not refused
  `step_up_missing`.
- **EC-03**: an action with `endpoint: false` that is not a tool, or a job-only action, is not refused
  `idempotency_missing` (jobs, events and workflow steps derive their own keys, ADR 0136 decision 3).
- **EC-04**: `idempotency: Idempotency.Optional` written out is a declaration and passes (ADR 0136 Enforcement: "no
  idempotency declaration").

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

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: IF a fixture query is L2 THEN gen SHALL report `query_above_l1`.
- **AC-002**: IF a fixture query has `preconditions` THEN gen SHALL report `query_precondition`.
- **AC-003**: IF a fixture action has `cache` THEN gen SHALL report `action_cache`.
- **AC-004**: IF a fixture L3 user action has no `stepUp` THEN gen SHALL report `step_up_missing`, and an L3 service-only
  action SHALL pass.
- **AC-005**: IF a fixture action with an endpoint has no `idempotency` THEN gen SHALL report `idempotency_missing`.
- **AC-006**: THE gen golden tests and `stackra gen --check` over every committed manifest SHALL pass.

## Success Criteria _(mandatory)_

- **SC-001**: each of the five codes refuses its fixture — verified by: unit
- **SC-002**: the gen golden suite and the committed manifests are unchanged except for the fixed classes' entries —
  verified by: unit (golden) and `stackra gen --check` on ci-box

## Out of scope

- The SDK half of G-138 (the SDKs creating the Idempotency-Key): wp-07.
- Refusal lists for entitlement, interceptor and step-up refusals: wp-64.
- Binding a `StepUpCheck` driver in any app or service.

## Assumptions

- A written `Idempotency.Optional` is a declaration (the enum's own contract and ADR 0136 Enforcement), so the fix for
  an undeclared client write that is safe to repeat is to write the policy it already has.
- The query above L1 and `cache`/`preconditions` refusals have no offender among the committed manifests today
  (surveyed 2026-11-03: 78 entries in 131 manifests).

## Open questions

- **Q-001** (owner): `identity.operator.bootstrap` (L4), `identity.session.end_user` (L3) and `privacy.hold.release`
  (L4) list both `ActorKind.User` and `ActorKind.Service`, and declare no `stepUp`. The pipeline applies `stepUp` to
  every caller (`action-pipeline.service.ts`, `checked`), and a service or job call carries no assurance (ADR 0406
  decision 1), so adding `stepUp` to them refuses their service callers `step_up_required` (the
  `ops bootstrap-operator` CLI path included). Which fix does the owner want?
  - A: the actions pipeline applies `stepUp` only when the caller is a user; gen refuses every L3 or L4 action whose
    actors include `User` without `stepUp`, and the three classes add `stepUp: AssuranceLevel.Aal2` (recommended).
  - B: gen refuses only as in A, and each of the three classes is split into a user action with `stepUp` and a
    service-only action.
  - C: gen refuses only actions whose actors are users alone for now; the three mixed classes stay unrefused until a
    later decision.

## Amendments

None.

## Status history

- 2026-11-03 · — → Draft · agent (wp-17) · created; blocked on Q-001
