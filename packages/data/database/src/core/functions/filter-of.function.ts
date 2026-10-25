/**
 * Stackra file contract:
 * Purpose: `filterOf`, a `Where<M>` as the filter MikroORM takes: a `$raw` fragment becomes the fragment's own key with
 *          no value, which is how MikroORM places a raw condition.
 * Boundary: internal; changes nothing else in the filter.
 * Runtime: node
 * Governing contract: ADR 0160 (decision 1).
 */
import type { FilterQuery } from "@mikro-orm/core";

import type { Where } from "#contracts/types/where.type";

/**
 * The MikroORM filter of `where`.
 *
 * @example
 * filterOf({ status: "paid", $raw: sql`on_hand < ${5}` }); // { status: "paid", [fragment.key]: [] }
 */
export function filterOf<M extends object>(where: Where<M>): FilterQuery<M> {
  if (where === null || typeof where !== "object" || Array.isArray(where) || !("$raw" in where))
    return where;
  const { $raw, ...rest } = where;
  return ($raw === undefined ? rest : { ...rest, [$raw.key]: [] }) as FilterQuery<M>;
}
