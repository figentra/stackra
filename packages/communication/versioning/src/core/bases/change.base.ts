/**
 * Stackra file contract:
 * Purpose: `Change<Subject>({ from, sunset })`, the kind base of a versioned conversion kept beside its subject in a
 *          `*.change.ts` file. An event change (`from: 1`) holds an earlier version of an integration event, with `up`
 *          and `down`; a dated change (`from: "2027-03-01"`) holds the shape a response schema had before that day,
 *          with `down` only, because responses only travel down. Both are shapes: the fields are the old shape, built
 *          with `X.create`.
 * Boundary: called only, with the subject as the type argument (gone at runtime: gen reads it and emits
 *           `registerChanges`). A called form without it fails with a readable hint (`WithPartner`); an event change
 *           takes an event and a whole `from`, a dated change a schema and a date. The options are checked and
 *           recorded as the `change` kind. `ChangeBase` (change-base.base.ts) and `EventChangeBase`
 *           (event-change-base.base.ts) are the instance bases; the entry exports them as types only, so no change
 *           skips its options.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 2, 5 and 44); ADR 0118 (2026-10-23 note: `up`, `down`, `*.change.ts`,
 *                     `@Upcast` retired); ADR 0141 (2026-10-23 note); ADR 0294 (decisions 1, 13 and 16).
 */
import { createKind, type WithPartner } from "@stackra/container";
import type { Event } from "@stackra/events";
import type { Schema } from "@stackra/validation";

import { ChangeBase } from "#core/bases/change-base.base";
import { EventChangeBase } from "#core/bases/event-change-base.base";
import { isCalendarDate } from "#core/functions/is-calendar-date.function";
import type { ChangeClass } from "#core/types/change-class.type";
import type { ChangeOptions } from "#core/types/change-options.type";

/** What a called form without its type argument fails with. */
type Hint = "Name the subject as a type argument: Change<OrderView>({ from, sunset })";

/** The two called forms, told apart by the subject's kind and the type of `from`. */
interface ChangeKind {
  <S extends Event = never>(
    options: WithPartner<S, ChangeOptions<number>, Hint>,
  ): ChangeClass<EventChangeBase<S>>;
  <S extends Schema = never>(
    options: WithPartner<S, ChangeOptions<string>, Hint>,
  ): ChangeClass<ChangeBase<S>>;
}

/** Checks the options of either form and records exactly `from` and `sunset`. */
function read(options: ChangeOptions) {
  const from = options?.from;
  if (typeof from === "number") {
    if (!Number.isInteger(from) || from < 1)
      throw new RangeError(`Change({ from }) must be a whole version from 1, got ${from}`);
  } else if (!isCalendarDate(from))
    throw new TypeError(
      `Change({ from }) takes the version an event change holds or the YYYY-MM-DD day of a dated change, got ${JSON.stringify(from)}`,
    );
  const { sunset } = options;
  if (!isCalendarDate(sunset))
    throw new TypeError(`Change({ sunset }) takes a YYYY-MM-DD day, got ${JSON.stringify(sunset)}`);
  if (typeof from === "string" && sunset <= from)
    throw new RangeError(`Change({ sunset }) must come after ${from}, got ${sunset}`);
  return { from, sunset };
}

/** The dated form's kind base. */
const datedChange = createKind("change", ChangeBase, read) as (
  options: ChangeOptions,
) => ChangeClass;

/** The event form's kind base. */
const eventChange = createKind("change", EventChangeBase, read) as (
  options: ChangeOptions,
) => ChangeClass;

/** Picks the form `from` names. */
function change(options: ChangeOptions): ChangeClass {
  return (typeof options?.from === "number" ? eventChange : datedChange)(options);
}
change.prototype = ChangeBase.prototype; // `instanceof Change` holds for both forms
Object.defineProperty(change, "name", { value: "Change" });

/**
 * The change kind base.
 *
 * @example
 * export class PointsEarnedV1Change extends Change<PointsEarned>({ from: 1, sunset: "2027-04-01" }) {
 *   memberId!: string;
 *
 *   up(v1: PointsEarnedV1Change): PointsEarned {
 *     return PointsEarned.create({ ...v1, tier: LoyaltyTier.Bronze, balanceAfter: v1.points });
 *   }
 *
 *   down(v2: PointsEarned): PointsEarnedV1Change {
 *     return PointsEarnedV1Change.create({ memberId: v2.memberId });
 *   }
 * }
 *
 * export class OrderView202703Change extends Change<OrderView>({ from: "2027-03-01", sunset: "2028-03-01" }) {
 *   totalMinor!: number;
 *
 *   down(view: OrderView): OrderView202703Change {
 *     return OrderView202703Change.create({ totalMinor: view.totals.totalMinor });
 *   }
 * }
 */
export const Change = change as unknown as ChangeKind;
