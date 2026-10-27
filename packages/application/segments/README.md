# @stackra/segments

Stackra segments: named audiences over any subject model (users, customers, contacts, companies), defined once and read
by every consumer: notification audiences, promotions, analytics and IAM visibility rules (ADR 0332). A segment is
dynamic (the published revision of a `@stackra/rules` rule set decides its members) or manual (a static list). Its
membership is materialised in a table and recomputed on the subject's row changes, hourly per scope and on a newly
published revision; every change of membership emits `MembershipEntered` or `MembershipLeft` through the outbox.

**Tier:** `tier:lib` (`packages/application/segments`). Entries `./contracts`, `.`, `./node` and `./testing`. Depends on
`@stackra/actions`, `@stackra/container`, `@stackra/contracts`, `@stackra/database`, `@stackra/errors`,
`@stackra/events`, `@stackra/model`, `@stackra/outbox`, `@stackra/queue`, `@stackra/rules`, `@stackra/validation` and
zod. The package names no subject model and knows no commerce.

## What is here

| Symbol                                | Entry         | Use                                                                                      |
| ------------------------------------- | ------------- | ---------------------------------------------------------------------------------------- |
| `SegmentRef`                          | `./contracts` | `{ kind: "segment", id }`, the audience a consumer stores (IAM's audience union)         |
| `SubjectRef`                          | `./contracts` | `{ model, id }`, the record a membership names: its model key and public id              |
| `SegmentSubject`                      | `./contracts` | what a consumer implements per subject model: `rules`, `ids(after, limit)`, `facts(ids)` |
| `SegmentKind`                         | `./contracts` | `Dynamic` or `Manual`                                                                    |
| `MembershipEntered`, `MembershipLeft` | `.`           | the integration events of every membership change (`segments.membership.entered.v1`)     |
| `SegmentKindMismatchError`            | `.`           | `segment_kind_mismatch` (412): a condition on a manual segment, a hand edit of a dynamic |
| `registerSegmentSubjects`             | `./node`      | `[{ key: "commerce.customer", model: Customer, type: CustomerSegmentSubject }]`          |
| `SegmentService`                      | `./node`      | `open`, `draft`, `publish`, `add`, `remove`, `recompute`, `recomputeSubject`, `connect`  |
| `SegmentMembershipService`            | `./node`      | what consumers read: `has(segment, subject)`, `segmentsOf(subject)`, `members(segment)`  |
| `RecomputeSegmentsAction`             | `./node`      | the `segment.recompute` job: one segment, or the hourly run of a scope                   |
| `RecomputeSegmentsInput`              | `./node`      | its input: `segmentId`, absent for the hourly run                                        |
| `SubjectChangeService`                | `./node`      | the outbox change consumer of every registered subject model                             |
| `Segment`, `SegmentMembership`        | `./node`      | the models: `segments.segments` and `segments.segment_memberships`                       |
| `SEGMENTS_TESTING_PLUGIN`             | `./testing`   | connects a testing app's `SegmentService` to the app                                     |

## Covering a subject model

```ts
export const CUSTOMER_SEGMENT_RULES = Rules.create({
  key: "commerce.customer_segment",
  sources: [CUSTOMER_FACTS], // the fields a segment over customers may test
});

export class CustomerSegmentSubject extends Service implements SegmentSubject {
  readonly rules = CUSTOMER_SEGMENT_RULES;

  private readonly customers: CustomerService;

  constructor(customers: CustomerService) {
    super();
    this.customers = customers;
  }

  async ids(after: string | null, limit: number): Promise<readonly string[]> {
    const rows = await this.customers.find(after === null ? {} : { id: { $gt: after } }, {
      orderBy: { id: "asc" },
      limit,
    });
    return rows.map((row) => row.id);
  }

  async facts(ids: readonly string[]): Promise<ReadonlyMap<string, Facts>> { ... }
}

registerSegmentSubjects([{ key: "commerce.customer", model: Customer, type: CustomerSegmentSubject }]);
```

Both methods run in the scope session of the segment being computed, so row-level security limits them to the
subjects at or below its scope node. A subject the facts leave out is gone, and leaves every segment.

## Defining a segment

```ts
const vip = await segments.open(ctx.scope, {
  name: "VIP",
  subject: "commerce.customer",
  kind: SegmentKind.Dynamic,
});
const revision = await segments.draft(vip.id, input.condition); // ConditionInvalidError when it does not check
await segments.publish(vip.id, revision); // queues the recompute in the segment's scope

const beta = await segments.open(ctx.scope, {
  name: "Beta",
  subject: "commerce.customer",
  kind: SegmentKind.Manual,
});
await segments.add(beta.id, [customerId]); // MembershipEntered for each new member
```

A condition is a `@stackra/rules` condition over the subject's registered fields, versioned on the segment's rule set.
Publish through `SegmentService.publish`: it queues the recompute in the same transaction. A revision published through
`RuleSetService` directly is picked up by the next hourly run, since `RuleSetPublished` names no scope to recompute in.

## Recomputing

- **On a subject's change.** `registerSegmentSubjects` watches the model's rows through the outbox; each committed
  change reaches `SubjectChangeService` in the row's scope, which evaluates that one subject against every dynamic
  segment over the model it sees, each in the segment's own scope.
- **Hourly, per scope.** `RecomputeSegmentsAction` carries `job.cron` (`0 * * * *`, once per scope the scheduler's
  `CronScopes` lists): it queues one full recompute per dynamic segment of the scope, so conditions on the time
  (`within_last`) and revisions published elsewhere catch up.
- **On a new revision.** `SegmentService.publish` queues the segment's full recompute.

A full recompute pages the subjects 500 at a time, evaluates the published revision with the clock's time, enters the
matched non-members, removes the members no longer matched and records the revision and the time. A dynamic segment
with no published revision keeps its members. Recomputing is idempotent; the membership table is unique per segment
and subject, so two concurrent runs enter a subject once (the loser retries).

## Reading membership

```ts
await memberships.has(
  { kind: "segment", id: promotion.segmentId },
  { model: "commerce.customer", id: customerId },
);
await memberships.segmentsOf({ model: "commerce.customer", id: customerId }); // SegmentRef[]
await memberships.members(audience, { after: cursor, limit: 500 }); // subject ids, ascending
```

Consumers read membership; they never evaluate a segment's rule set (ADR 0332 decision 5). Another service reacts to
`MembershipEntered` and `MembershipLeft` instead of reading the table.

## Tables and scope

`segments.segments` and `segments.segment_memberships` (migration `segments.0001_create_segments`, with the `ltree`
extension) carry `scope_id` and `scope_path` under forced row-level security. The recompute job runs in each segment's
scope and the change consumer in the row's scope, so nothing reads across scopes.

## Boot and testing

The boot connects the service to the container (`segments.connect(container)`), so it can resolve the registered
subject classes, and gen's entry registers `RecomputeSegmentsAction` with `registerJobs` and `registerScheduledJobs`
under its locked key `segments.segment.recompute@1`. In a test, importing `@stackra/segments/testing` connects every
compiled testing app.

## Not here

- A subject's change in a child scope does not reach a segment defined at an ancestor scope, which the row's scope
  session cannot see; the hourly run catches that segment up.
- A full recompute holds the matched ids and the current members of one segment in memory (fine to about a million
  subjects).
- A CRM, and syncing membership to a CRM vendor: a connector in the integrations service (ADR 0332 decision 6).
