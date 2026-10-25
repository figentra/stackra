/**
 * Stackra file contract:
 * Purpose: `slots(definition)`, what gen calls in `#stackra/slots`: it turns a tree of slot names into the same tree of
 *          `SlotRef`s with derived keys (`Slots.Orders.SalesOverview.Header` is `orders.sales_overview.header`).
 * Boundary: pure; returns frozen objects. A list of names takes each place from the name (Header is a Band, Main and
 *           Footer are Grids, Aside, Tabs, Banner and Checklist are their own place, any other name a Grid); a map gives
 *           each place. Names are PascalCase.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 18: slots are typed places); ADR 0294 (decision 20: derived identities).
 */
import { Enum } from "@stackra/contracts";

import { Place } from "#core/enums/place.enum";
import { snakeCase } from "#core/functions/snake-case.function";
import type { SlotGroup } from "#core/types/slot-group.type";
import type { SlotRef } from "#core/types/slot-ref.type";
import type { SlotTree } from "#core/types/slot-tree.type";

/** A slot or group name. */
const NAME = /^[A-Z][A-Za-z0-9]*$/;

/** The place a slot named in a list takes. */
const PLACE_BY_NAME: Readonly<Record<string, Place>> = Object.freeze({
  Header: Place.Band,
  Main: Place.Grid,
  Footer: Place.Grid,
  Aside: Place.Aside,
  Tabs: Place.Tabs,
  Banner: Place.Banner,
  Checklist: Place.Checklist,
});

/** The checked name. */
function nameOf(name: string, path: string): string {
  if (!NAME.test(name))
    throw new RangeError(`slots: "${path}${name}" is not a PascalCase slot or group name`);
  return name;
}

/** The slot ref of `name` under `prefix`. */
function slotOf(prefix: string, name: string, place: Place): SlotRef {
  return Object.freeze({ key: `${prefix}${snakeCase(name)}`, place });
}

/** The refs of `group` under the key prefix `prefix`. */
function build(group: SlotGroup, prefix: string): object {
  const out: Record<string, unknown> = {};
  if (Array.isArray(group)) {
    for (const name of group as readonly string[])
      out[nameOf(name, prefix)] = slotOf(prefix, name, PLACE_BY_NAME[name] ?? Place.Grid);
    return Object.freeze(out);
  }
  const places: readonly string[] = Enum.values(Place);
  for (const [name, value] of Object.entries(
    group as Readonly<Record<string, Place | SlotGroup>>,
  )) {
    nameOf(name, prefix);
    if (typeof value === "string") {
      if (!places.includes(value))
        throw new RangeError(
          `slots: "${prefix}${name}" takes a Place, got ${JSON.stringify(value)}`,
        );
      out[name] = slotOf(prefix, name, value as Place);
    } else out[name] = build(value, `${prefix}${snakeCase(name)}.`);
  }
  return Object.freeze(out);
}

/**
 * The slot refs of `definition`.
 *
 * @throws RangeError when a name is not PascalCase or a mapped slot's value is not a `Place`.
 * @example
 * export const Slots = slots({
 *   Dashboard: { Header: Place.Band, Main: Place.Grid },
 *   Orders: { SalesOverview: ["Header", "Main"] },
 * });
 * Slots.Orders.SalesOverview.Main; // { key: "orders.sales_overview.main", place: "grid" }
 */
export function slots<const D extends Readonly<Record<string, SlotGroup>>>(
  definition: D,
): SlotTree<D> {
  const out: Record<string, unknown> = {};
  for (const [name, group] of Object.entries(definition))
    out[nameOf(name, "")] = build(group, `${snakeCase(name)}.`);
  return Object.freeze(out) as SlotTree<D>;
}
