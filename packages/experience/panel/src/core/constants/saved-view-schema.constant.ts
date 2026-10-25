/**
 * Stackra file contract:
 * Purpose: `SAVED_VIEW_SCHEMA`, the zod schema of `SavedView` this package ships (its `X$`): the resource, the name,
 *          the owner and sharing, the filter values, the sort, the columns shown, the grouping (a key and an optional
 *          sub-group key) and the totals.
 * Boundary: the stand-in for what gen will write for this package. A saved view is user input at the store's
 *           boundary: keys are dotted row paths, and a sub-group needs a group.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decision 14); ADR 0307 (rules 6 and 9: views store declared keys only).
 */
import { Enum, SortDirection } from "@stackra/contracts";
import { z } from "zod";

import { Aggregate } from "#core/enums/aggregate.enum";
import { ViewSharing } from "#core/enums/view-sharing.enum";

/** A dotted row path. */
const PATH = z
  .string()
  .regex(/^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/, "must be a row path");

/** The shipped `SavedView$`. */
export const SAVED_VIEW_SCHEMA = z.object({
  id: z.string().min(1),
  resource: z.string().min(1),
  name: z.string().min(1).max(120),
  owner: z.string().min(1),
  sharing: z.enum(Enum.values(ViewSharing)).default(ViewSharing.Private),
  filter: z.record(z.string(), z.unknown()).default(() => ({})),
  sort: z.object({ key: PATH, direction: z.enum(Enum.values(SortDirection)) }).exactOptional(),
  columns: z.array(PATH).exactOptional(),
  // oxlint-disable-next-line unicorn/no-thenable -- reason: `then` is the saved view's sub-group key, not a promise
  group: z.object({ by: PATH, then: PATH.exactOptional() }).exactOptional(),
  totals: z
    .array(z.object({ key: PATH, aggregate: z.enum(Enum.values(Aggregate)) }))
    .default(() => []),
});
