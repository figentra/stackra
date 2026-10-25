# Feature Specification: `@stackra/segments` wave 7, audiences defined by rules

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/segments` (application, wave 7, new package from ADR 0332): a named audience over any subject
model, dynamic (a @stackra/rules rule set, ADR 0331) or manual (a static list); membership materialised in a table keyed
by segment and subject (model key and public id), recomputed on the subject's row changes (the outbox's
`registerChangeConsumers`), on a schedule (a `job.cron` the scheduler dispatches through the queue) and on a new
rule-set revision; `membership-entered` and `membership-left` integration events through @stackra/events and the
outbox; consumers read membership and never evaluate the rule set; no CRM.

## Impact

- **Apps touched**: none
- **Services touched**: none (no template service imports it yet; notifications, promotions and IAM are its readers)
- **Packages touched**: `packages/application/segments` (new member)
- **Cross-service events**: `MembershipEntered` (`segments.membership.entered.v1`) and `MembershipLeft`
  (`segments.membership.left.v1`), integration events through the outbox; wire names locked by gen
- **Tenancy and data**: two tables in the package's own schema, `segments.segments` and `segments.segment_memberships`,
  each with `scope_id` and `scope_path` (`t.scopeId()`, `t.scopePath()`) under forced row-level security on
  `scope_path` (`app.scope_paths`, ancestor match). The recompute job runs in each segment's scope and the change
  consumer in the row's scope, so no worker reads across scopes (data review). No tenant vocabulary is declared (R-59,
  ADR 0323)
- **Secrets**: none
- **ADR needed**: no (ADR 0332 decides the package; ADR 0331 the rule engine; ADR 0148 the schedule; ADR 0141 the
  events); the gaps are listed under Open items
- **New dependencies**: none outside the workspace and the catalogs (`zod` from the default catalog); runtime edges to
  actions, container, contracts, database, errors, events, model, outbox, queue, rules and validation
- **Deploy modes**: same code in all
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/application/segments/README.md`, `packages/application/segments/AGENTS.md`; ADR 0332 is cited and amended only by a note if a decision here changes
- **Lane**: lite
- **Change risk**: R2 (new public contract and two tables every audience consumer relies on)

## Clarifications

### Session 2026-10-25

The package follows ADR 0332, 0331, 0148, 0141, the v3.1 registry row ("Audiences defined by rules or static lists",
entries `./contracts`, `.`, `./node` (+ `./config`, `./testing`), exports `.` Segment, SegmentMembership and
`./contracts` SegmentRef; no template import) and the owner decisions of 2026-10-24. The choices recorded:

- Entries: `./contracts` (`SegmentKind`, `SegmentRef`, `SubjectRef`, `SegmentSubject`), `.` (the two events and the
  kind refusal), `./node` (models, services, job, change consumer, registration) and `./testing` (the plugin) exist
  because each has a file; no `./config`, nothing configurable. `Segment` and `SegmentMembership` are models, so they
  ship from `./node` as every sibling's models do, not from `.` as the registry row lists
- A consumer covers a model by implementing `SegmentSubject` (its `Rules`, `ids(after, limit)`, `facts(ids)`) and
  registering `{ key, model, type }` with `registerSegmentSubjects`; the package names no subject
- `SegmentService` reads the subject classes from the container given to `connect`, as the relay and the queue worker
  do; the testing plugin connects each testing app
- Conditions are @stackra/rules rule sets (`RuleSetService`): a dynamic segment opens one on create; `draft` checks the
  condition against the subject's `Rules`; evaluation uses `evaluate` of @stackra/rules with the clock's time
- Recompute on a new revision: `SegmentService.publish` queues the segment's recompute in its scope in the publishing
  transaction. `RuleSetPublished` is a domain event that names no scope (and nothing dispatches domain events yet), so a
  revision published elsewhere is caught by the hourly run
- Recompute on a schedule: `RecomputeSegmentsAction` (`segment.recompute`, job actor) carries `job.cron` `0 * * * *`
  with `perTenant: true`; each scope's run queues one full recompute per dynamic segment, each in the segment's scope
- Recompute on a subject's change: `registerSegmentSubjects` registers `SubjectChangeService` for the model with the
  outbox; a change re-evaluates that one subject in every dynamic segment over the model its scope session sees
- Membership writes record the event on the row (`enter`, `leave`) and flush, so the outbox writer stores the event in
  the same transaction; the table is unique per segment and subject, so a concurrent run enters a subject once
- Manual edits (`add`, `remove`) run in the caller's scope session; an id the subject's facts do not know is refused
- Owner, 2026-10-24: data gate lifted, so the tables and migration build now; the model review happens on the data-wave
  PR

## User Scenarios & Testing

### User Story 1 - Define a dynamic segment (Priority: P1)

An admin creates "VIP customers", drafts a condition over the registered customer fields and publishes it; the
membership is computed and each new member emits `MembershipEntered`.

**Independent Test**: `src/node/services/__tests__/segment.service.test.ts`,
`src/node/services/__tests__/segment-membership.service.test.ts`.

**Acceptance Scenarios**:

1. **Given** a dynamic segment with a published revision, **When** it is recomputed, **Then** the matched non-members
   enter, the unmatched members leave, and the revision and time are recorded.
2. **Given** a dynamic segment with no published revision, **When** it is recomputed, **Then** its members stay.

### User Story 2 - Keep membership current (Priority: P1)

A customer's change, the hourly run and a new revision recompute membership.

**Independent Test**: `src/node/services/__tests__/subject-change.service.test.ts`,
`src/node/actions/__tests__/recompute-segments.action.test.ts`,
`src/node/functions/__tests__/register-segment-subjects.function.test.ts`.

### User Story 3 - Keep a manual list (Priority: P2)

An admin adds and removes customers by hand; each change emits its event; an unknown id is refused.

**Independent Test**: `src/node/services/__tests__/segment.service.test.ts`.

### User Story 4 - Read membership (Priority: P1)

A promotion asks whether a customer is in its segment; notifications page a segment's members.

**Independent Test**: `src/node/services/__tests__/segment-membership.service.test.ts`.

### Edge Cases

- A subject deleted: its facts are gone, so it leaves every dynamic segment on the change.
- Two recomputes of one segment at once: the unique membership index lets one enter a subject; the other retries.
- A condition drafted for a manual segment, or a hand edit of a dynamic one: `segment_kind_mismatch`.
- A segment over a subject model no longer registered: refused (`subject_unknown`).
- A subject in a child scope whose segment sits at an ancestor scope: caught by the hourly run, not by the change.

## Requirements

- **FR-001**: The package SHALL be `@stackra/segments` at `packages/application/segments`, `tier:lib`, entries
  `./contracts`, `.`, `./node` and `./testing` only.
- **FR-002**: A segment SHALL be named, over one registered subject model key, of kind dynamic (with a rule set) or
  manual, and SHALL name no subject model in the package.
- **FR-003**: Membership SHALL be stored per segment and subject (model key and public id) under the segment's scope with
  forced row-level security, and SHALL be read through `has`, `segmentsOf` and `members`.
- **FR-004**: A full recompute SHALL evaluate the published revision for every subject of the segment's scope with the
  clock's time and bring membership in line; a dynamic segment with no published revision SHALL keep its members.
- **FR-005**: Recompute SHALL run on a registered subject's committed row change, hourly per scope and on a revision
  published through `SegmentService.publish`.
- **FR-006**: Every membership change, dynamic or manual, SHALL record one `MembershipEntered` or `MembershipLeft`
  integration event in the transaction that writes it.
- **FR-007**: A condition SHALL be drafted only for a dynamic segment and checked against the subject's `Rules`; a hand
  edit SHALL apply only to a manual segment and refuse an unknown subject id.
- **FR-008**: No identifier SHALL declare tenant vocabulary, and the package SHALL import no `@mikro-orm/*` module.

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/`; the tests run in the separate testing workflow
  (owner mode, 2026-10-24: not run here).
- **SC-003**: `oxfmt` and `oxlint` are clean on the package and the validator reports nothing for it; the typecheck
  waits for the integrator's install (owner instruction: lint and format only).

## Open items (for the owner, not blocking)

- Gen needs: `registerJobs` and `registerScheduledJobs` rows for `RecomputeSegmentsAction`
  (`segments.segment.recompute@1`), the wire names of the two events, `segments.connect(container)` at boot, and the
  generated `SegmentsModule` wiring.
- `RuleSetPublished` carries no scope and nothing dispatches domain events yet, so segments recompute on their own
  `publish`; a scope on the event (or an in-transaction dispatch) would let segments listen to it.
- A subject's change does not reach a segment at an ancestor of the row's scope (invisible to that session); the hourly
  run catches it up. A full recompute holds one segment's matched ids and members in memory (fine to about a million).
- The hourly cadence is fixed in the job option; per-segment schedules are not built.

## Status history

- 2026-10-25 · — → Implementing · Claude (package-builder) · spec for a package written in owner mode (develop now, test later)
