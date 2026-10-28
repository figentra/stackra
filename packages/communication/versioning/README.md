# @stackra/versioning

Dated API versions and versioned integration events (ADR 0118, 0141, 0305). A breaking change to a response schema or
an integration event adds one `Change<Subject>({ from, sunset })` class beside its subject, in a `*.change.ts` file.
The class's fields are the old shape. While only the latest version exists, the package does nothing.

**Tier:** `tier:lib` (`packages/communication/versioning`). Entry `.` only. Depends on `@stackra/contracts`,
`@stackra/container`, `@stackra/validation`, `@stackra/errors`, `@stackra/events` and `@stackra/support`.

## What is here

| Symbol                                                                                               | Use                                                                                               |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `Change`                                                                                             | the kind base: an event change (`from: 1`) or a dated response change (`from: "2027-03-01"`)      |
| `registerChanges`                                                                                    | links each subject to its changes; gen emits the call                                             |
| `downgrade`                                                                                          | shapes a current value for an older dated version or event version (`down`)                       |
| `publishedVersions`                                                                                  | the older versions of an event still published on a day (live changes)                            |
| `upgrade`                                                                                            | reads an old integration event payload as the current version (`up`)                              |
| `resolveVersion`                                                                                     | picks a request's version: `Stackra-Version` header, then the pin, then the fallback              |
| `applyVersionHeaders`                                                                                | writes the resolved `Deprecation` and `Sunset` on a response and adds `Stackra-Version` to `Vary` |
| `VERSIONING_HEADERS`                                                                                 | `Stackra-Version`, `Deprecation`, `Sunset`                                                        |
| `VERSION_SUPPORT_MONTHS`                                                                             | the default support window after a successor ships (12 calendar months, ADR 0118)                 |
| `UnsupportedVersionError`                                                                            | a version the service does not serve (400)                                                        |
| `VersionSunsetError`                                                                                 | a version past its sunset (412)                                                                   |
| `ChangeOptions`, `ChangeClass`, `ChangeBase`, `EventChangeBase`, `VersionRequest`, `ResolvedVersion` | types                                                                                             |

## An event version

An integration event at `version: 2` keeps a change from version 1 beside it. Both versions are published until the
sunset; `up` reads a stored v1 row as v2, and `down` gives a v1 consumer the shape it was built against.

```ts
import { Change } from "@stackra/versioning";
import { PointsEarned } from "#node/events/points-earned.event";

export class PointsEarnedV1Change extends Change<PointsEarned>({ from: 1, sunset: "2027-04-01" }) {
  memberId!: string;

  @Int
  points!: number;

  up(v1: PointsEarnedV1Change): PointsEarned {
    return PointsEarned.create({ ...v1, tier: LoyaltyTier.Bronze, balanceAfter: v1.points });
  }

  down(v2: PointsEarned): PointsEarnedV1Change {
    return PointsEarnedV1Change.create({ memberId: v2.memberId, points: v2.points });
  }
}
```

```ts
const earned = upgrade(PointsEarned, row.payload, 1); // a v1 row, checked by the v1 schema, as v2
const v1 = downgrade(PointsEarned, earned, 1);
```

## A dated response change

A response schema changes by date. Callers pinned before the date get the old shape; responses only travel down, so a
dated change has no `up`. The date must be one of the service's supported versions.

```ts
export class OrderView202703Change extends Change<OrderView>({
  from: "2027-03-01",
  sunset: "2028-03-01",
}) {
  @Int({ min: 0 })
  totalMinor!: number;

  down(view: OrderView): OrderView202703Change {
    return OrderView202703Change.create({ totalMinor: view.totals.totalMinor });
  }
}
```

The generated gateway resolves the caller's version once per request and shapes the response with it:

```ts
const resolved = resolveVersion({
  header: request.headers.get(VERSIONING_HEADERS.version),
  pin: apiKey.version, // set when the key or OAuth app was created
  supported: versioning.supported,
  fallback: versioning.fallback,
  supportMonths: versioning.supportMonths, // optional; 12 when left out
  now: clock.now(),
});
const response = Response.json(downgrade(OrderView, view, resolved.version));
applyVersionHeaders(response.headers, resolved);
// a 2026-10-01 caller: Deprecation: @1803859200, Sunset: Wed, 01 Mar 2028 00:00:00 GMT, Vary: Stackra-Version
```

## Deprecated, then retired

A dated version is deprecated from the day its successor ships and served until its sunset: the earlier of the end of
its support window (`supportMonths` calendar months after the successor, 12 by default, a setting of the service) and
the earliest `sunset` of the dated changes after it. A version that no change follows still gets both headers and is
still retired at the end of the window. From the sunset day on, `resolveVersion` refuses it with `VersionSunsetError`
(412) before the call runs; a version not in `supported` at all is refused with `UnsupportedVersionError` (400).

Each change converts straight from the subject's current shape, as its types say, so one change serves one old
version and no chain is walked. When the subject changes again, the compiler points at every older change's `down`
that reads a field the subject lost.

## Not here

- Sending `Stackra-Version` from a client: `stackraVersion` in `@stackra/transport`.
- The versioning config (`supported`, `fallback`): the service's own `Config({ schema })` class.
- Publishing both versions of an event until the sunset, and reading another version on receipt: the outbox's relay
  and inbox (stackra-403), through `publishedVersions`, `downgrade` and `upgrade`.
- The gen checks (a change date missing from the config, a version bump with no change, a change past its sunset).
