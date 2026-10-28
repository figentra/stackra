/**
 * Stackra file contract:
 * Purpose: `tableInput({ sort, filters })`, the schema a generated client writes for a resource table's list input:
 *          the caller's view of `TableInput`, narrowed to the table's sort keys and filter shape.
 * Boundary: `sort` and `filter` are optional here, because the server's own generated schema applies the table's
 *           default sort and an empty filter; `limit` is 20, 50 or 100, 20 by default. Authored code extends
 *           `TableInput` instead.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0307 (resource tables); the HTTP conventions (cursor pagination).
 */
import { Enum, SortDirection } from "@stackra/contracts";
import { z } from "zod";
import type { ZodObject } from "zod";

/**
 * A new schema of a table input with sort keys `sort` and the filter shape `filters`.
 *
 * @param options - the sortable keys of the table, in declaration order, and the zod object of its filters.
 * @example
 * export class ListOrdersInput extends remoteShape(
 *   "orders.ListOrdersInput",
 *   tableInput({ sort: ["totals.totalMinor", "createdAt"], filters: z.object({ ... }) }),
 * ) {}
 */
// oxlint-disable-next-line typescript/explicit-module-boundary-types -- B-7: the schema type is inferred on purpose; spelling the generic zod object (exactOptional, default, enum of K) by hand would duplicate zod internals with no typecheck to prove it
export function tableInput<const K extends string, F extends ZodObject>(options: {
  readonly sort: readonly [K, ...K[]];
  readonly filters: F;
}) {
  return z.object({
    cursor: z.string().exactOptional(),
    limit: z.union([z.literal(20), z.literal(50), z.literal(100)]).default(20),
    sort: z
      .object({ key: z.enum(options.sort), direction: z.enum(Enum.values(SortDirection)) })
      .exactOptional(),
    filter: options.filters.exactOptional(),
  });
}
