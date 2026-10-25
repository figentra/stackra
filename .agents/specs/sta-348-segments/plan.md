# Plan: `@stackra/segments` wave 7

**Spec**: `.agents/specs/sta-348-segments/spec.md`

## Design

- Four entries through stand-in barrels (STA-339 replaces them): `./contracts` from `src/contracts/` (the leaf:
  `SegmentKind`, `SegmentRef`, `SubjectRef`, `SegmentSubject`), `.` from `src/core/` (`MembershipEntered`,
  `MembershipLeft`, `SegmentKindMismatchError`), `./node` from `src/node/`, `./testing` from `src/testing/`.
- `Segment` (`seg`) and `SegmentMembership` (`sgm`) models; `CreateSegmentsMigration` creates both tables with the
  `ltree` extension, the kind check, the nullable rule set link, the cascading segment key, the unique
  `(segment_id, subject_id)` index, the `(subject_model, subject_id)` index and the forced scope policy on each.
- `registerSegmentSubjects(rows)` fills the internal `SEGMENT_SUBJECTS` (model key to model and subject class) and calls
  the outbox's `registerChangeConsumers([[model, SubjectChangeService]])`.
- `SegmentService` (`CrudService<Segment>`; `RuleSetService`, `SegmentMembershipService`, `QueueService`, `Database`,
  `Clock`; `connect(resolver)`): `create` (opens a rule set for a dynamic segment), `draft`/`publish` through the rule
  set (publish pushes `RecomputeSegmentsAction` with the segment's scope), `add`/`remove` for a manual segment,
  `queueRecomputes` (one push per dynamic segment, each in its scope), `recompute` (full pass), `recomputeSubject`
  (`withScope` per segment, one subject). `reconcile` loads the published revision, pages `ids` 500 at a time, evaluates
  `facts` with `evaluate` of @stackra/rules, and diffs against `membersOf`.
- `SegmentMembershipService` (`CrudService<SegmentMembership>`): `has`, `segmentsOf`, `members` for consumers;
  `membersOf`, `enter` (create + `MembershipEntered` + flush) and `leave` (`MembershipLeft` + remove + flush).
- `RecomputeSegmentsAction` (`segment.recompute`, `ActorKind.Job`, `job: { timeout: "15m", cron: { schedule:
"0 * * * *", perTenant: true, input: {} } }`) with `RecomputeSegmentsInput` (optional `segmentId`).
- `SubjectChangeService` (a `ChangeConsumer`): finds the key of the changed model and calls `recomputeSubject`.
- `SEGMENTS_TESTING_PLUGIN` connects each compiled testing app's `SegmentService` to the app.

## Constitution Check

| Law                                   | Result | Note                                                                                                             |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/application/segments`; imports only `tier:lib` packages; no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                              |
| Security                              | PASS   | conditions are checked against registered fields; manual ids are checked against the subject; RLS on both tables |
| HTTP and events                       | PASS   | no endpoint; the job is job-actor only; membership changes leave as integration events through the outbox        |
| Tenancy                               | PASS   | no tenant word declared; a scope is a `ScopeRef`; every recompute runs in a scope session (spec Impact)          |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) runs the tests           |
| Not built yet (ADR 0227)              | PASS   | no CRM, no runtime schema engine: a condition is data over registered fields (ADR 0331 decision 10)              |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                        |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                |
| Deploy modes (ADR 0076)               | PASS   | one build in SaaS, on-prem and air-gapped                                                                        |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                               |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; ADR 0332 stands, the gaps are listed in the spec                       |

- Boundaries: runtime imports of actions, container, contracts, database, errors, events, model, outbox, queue, rules
  and validation; dev-only `@stackra/testing` and the tooling presets; no `@mikro-orm/*` (ADR 0097 d2).
- Versions: catalogs and `workspace:*` only.
- Naming: services `<Name>Service`, the job `RecomputeSegmentsAction` with `RecomputeSegmentsInput`, the refusal ends in
  `Error`, noun events `MembershipEntered`/`MembershipLeft`, the migration `CreateSegmentsMigration`, no `define`
  prefix, no "hook"; `SegmentKind` is an `Enum.of` value.

## Properties

- **P-001**: `package.json` names `@stackra/segments` at `packages/application/segments` and `exports` lists only `./contracts`, `.`, `./node` and `./testing` — Validates: FR-001
- **P-002**: for every `create`, the stored segment names the registered subject key and kind, a dynamic one a new rule set and a manual one none; an unregistered key is refused — Validates: FR-002
- **P-003**: the migration creates both tables with the scope columns, the forced scope policy and one membership per segment and subject; `has`, `segmentsOf` and `members` read by segment and subject — Validates: FR-003
- **P-004**: for every full recompute with a published revision, afterwards the members equal the subjects whose facts match it at the clock's time; with none, the members are unchanged — Validates: FR-004
- **P-005**: a registered model's row change calls `recomputeSubject` with its key; the job without a segment queues one recompute per dynamic segment in its scope; `publish` queues the segment's recompute — Validates: FR-005
- **P-006**: for every subject entered or removed, exactly one `MembershipEntered` or `MembershipLeft` is recorded on its row before the flush — Validates: FR-006
- **P-007**: `draft` and `publish` refuse a manual segment and `add` and `remove` a dynamic one with `segment_kind_mismatch`; `add` refuses each unknown id by index and adds nothing — Validates: FR-007
- **P-008**: `grep -rE "(const|let|class|interface|type|function) [A-Za-z]*[Tt]enant" packages/application/segments/src` and `grep -r "@mikro-orm" packages/application/segments/src` find nothing — Validates: FR-008

## Deploy modes

| Mode       | Behaviour                                                                                           |
| ---------- | --------------------------------------------------------------------------------------------------- |
| SaaS       | the same build; the hourly run is the scheduler's Encore CronJob tick, events leave through Pub/Sub |
| On-prem    | identical: the same build; the scheduler's timer and the outbox's in-process or Postgres transport  |
| Air-gapped | identical: needs no network; Postgres holds segments, membership and the outbox                     |
