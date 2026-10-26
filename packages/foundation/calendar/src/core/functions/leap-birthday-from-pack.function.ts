/**
 * Stackra file contract:
 * Purpose: `leapBirthdayFromPack`, the `LeapBirthday` rule a resolved market pack sets on a date (pack key
 *          `calendar.leap_birthday`), the value `ageOn` takes.
 * Boundary: pure over a `ResolvedPack` of `@stackra/market-packs`. A missing or unknown value throws a `RangeError`:
 *           the package never picks a jurisdiction's rule.
 * Runtime: isomorphic
 * Governing contract: ADR 0387 (pack values for LeapBirthday); ADR 0366 (decision 8).
 */
import { Enum } from "@stackra/contracts";
import { type ResolvedPack, valueOf } from "@stackra/market-packs";

import { LeapBirthday } from "#core/enums/leap-birthday.enum";
import type { IsoDate } from "#core/types/iso-date.type";

/**
 * The leap-birthday rule of `resolved` on `on`.
 *
 * @example
 * ageOn(birth, today, leapBirthdayFromPack(resolved, today));
 */
export function leapBirthdayFromPack(resolved: ResolvedPack, on: IsoDate): LeapBirthday {
  const value = valueOf(resolved, "calendar.leap_birthday", on)?.value;
  const rule = Enum.values(LeapBirthday).find((code) => code === value);
  if (rule === undefined)
    throw new RangeError(`${resolved.market} sets no calendar.leap_birthday on ${on}`);
  return rule;
}
