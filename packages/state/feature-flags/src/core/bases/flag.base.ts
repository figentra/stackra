/**
 * Stackra file contract:
 * Purpose: `Flag`, the kind base of a feature flag: `class HelpCentreFlag extends Flag({ default: false }) {}` in a
 *          module's `access/` group or an app's `flags/` group, one `<name>.flag.ts` per flag. The interface of the
 *          same name is its instance side.
 * Boundary: called only (`default` is required). The call checks and records its options in the kind registry, with
 *           the defaults filled in (no expiry, no removal issue, platform and tenant scopes); `flagRefs` and gen read
 *           them through `kindOf`. The key and the label are derived from the class name, the owner from the module,
 *           so none is an option. A flag holds no value: values come from the `FlagProvider`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16, 20 and 25); ADR 0307 (decision 25); ADR 0305 (rules 2 and 3); ADR 0213
 *                     (decisions 3 and 7).
 */
import { createKind } from "@stackra/container";

import { DEFAULT_FLAG_SCOPES } from "#core/constants/default-flag-scopes.constant";
import type { FlagClass } from "#core/types/flag-class.type";
import type { FlagOptions } from "#core/types/flag-options.type";

/** The instance side of every flag class. */
export interface Flag {
  /** Type-only kind brand, so a class of another kind cannot stand in for a flag. */
  readonly "~kind": "flag";
}

/** An expiry: a calendar day, `YYYY-MM-DD`. */
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Whether `text` is a `YYYY-MM-DD` day that exists; the round trip refuses `2027-02-30`, which Date rolls over. */
function isDay(text: string): boolean {
  const day = new Date(`${text}T00:00:00Z`);
  return ISO_DAY.test(text) && !Number.isNaN(day.getTime()) && day.toISOString().startsWith(text);
}

/**
 * Checks `options` and fills in the defaults.
 *
 * @throws RangeError when `expires` is not a real `YYYY-MM-DD` day or `scopes` is empty.
 */
function readFlagOptions(options: FlagOptions): Readonly<Record<string, unknown>> {
  const { expires = null, removalIssue = null, scopes = DEFAULT_FLAG_SCOPES } = options;
  if (expires !== null && !isDay(expires))
    throw new RangeError(`A flag's expires is a YYYY-MM-DD day, not "${expires}"`);
  if (scopes.length === 0) throw new RangeError("A flag needs at least one scope");
  return { default: options.default, expires, removalIssue, scopes: Object.freeze([...scopes]) };
}

/**
 * The flag kind base.
 *
 * @example
 * export class PricingYearlyFirstFlag extends Flag({
 *   default: false,
 *   expires: "2027-03-31",
 * }) {}
 */
export const Flag = createKind(
  "flag",
  // oxlint-disable-next-line typescript/no-extraneous-class -- reason: createKind needs a class; a flag holds no state
  class FlagBase {},
  readFlagOptions,
) as (options: FlagOptions) => FlagClass;
