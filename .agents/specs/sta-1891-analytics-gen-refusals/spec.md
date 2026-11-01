# Analytics: the gen refusals

**Linear**: STA-1891
**Status**: implementing
**Clarifications status**: complete

## Problem

`stackra gen` refuses `@stackra/analytics` on main, so the Quality Gate stops at Typecheck (`gen:workspace`):

- `analytics-batch-accepted.event.ts` `event_name_prefixed`: the event name `analytics.batch.accepted` starts with the
  module key, which gen adds itself.
- `analytics-batch-accepted.event.ts` `shape_unknown_type`: `deliveries` is typed by the interface `AnalyticsDelivery`,
  which is not a shape type.
- `ingest-analytics-batch-input.schema.ts` `shape_hatch_local_binding`: `@Field(DELIVERIES)` uses a constant declared
  in the same file, which the generated schema cannot import.

## Change

Each fix follows gen's own fix text, with no behaviour change:

1. The event's `name` becomes `batch.accepted`; the wire name stays `analytics.batch.accepted.v1`.
2. `AnalyticsBatchAccepted.deliveries` takes the `@Field(zod)` escape hatch with a `// reason:`, as the ingest input
   already does, with the same rule its `registerSchemas` entry holds.
3. The ingest input writes its zod inline in the hatch (1 to 100 deliveries), with no local constant.

## Acceptance

- `stackra gen` writes `@stackra/analytics` with no refusal.
- The analytics tests pass unchanged.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: @stackra/analytics
- **Cross-service events**: none (the wire name is unchanged)
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no; it applies ADR 0141 and ADR 0095 as amended
- **New dependencies**: none
- **Deploy modes**: none
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: bug
- **Change risk**: R0
