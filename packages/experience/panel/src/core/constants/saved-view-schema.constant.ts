/**
 * Stackra file contract:
 * Purpose: `SAVED_VIEW_SCHEMA`, the zod schema of `SavedView` this package ships (its `X$`): the resource, the name,
 *          the owner and sharing (with the role of a role copy), the version, the layout and the path it is laid out
 *          by, the filter values, the sort, the columns shown, the grouping (a key and an optional sub-group key) and
 *          the totals.
 * Boundary: the stand-in for what gen will write for this package. A saved view is user input at the store's
 *           boundary: keys are dotted row paths, a sub-group needs a group, a role copy names its role, and a board or
 *           calendar names its `layoutBy` path. Whether the keys are declared is the server validator's check
 *           (`unknownViewKeys`), not this schema's.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decision 14); ADR 0307 (rules 6 and 9: views store declared keys only); ADR 0271
 *                     (decisions 2, 3 and 8: layout, role copies, optimistic concurrency).
 */
import { Enum, SortDirection } from "@stackra/contracts";
import { z } from "zod";

import { Aggregate } from "#core/enums/aggregate.enum";
import { ViewLayout } from "#core/enums/view-layout.enum";
import { ViewSharing } from "#core/enums/view-sharing.enum";

/** A dotted row path. */
const PATH = z
  .string()
  .regex(/^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/, "must be a row path");

/** The layouts laid out by a row path. */
const LAID_OUT_BY: ReadonlySet<string> = new Set([ViewLayout.Board, ViewLayout.Calendar]);

/** The shipped `SavedView$`. */
export const SAVED_VIEW_SCHEMA = z
  .object({
    id: z.string().min(1),
    resource: z.string().min(1),
    name: z.string().min(1).max(120),
    owner: z.string().min(1),
    sharing: z.enum(Enum.values(ViewSharing)).default(ViewSharing.Private),
    role: z.string().min(1).max(200).exactOptional(),
    version: z.number().int().min(1).default(1),
    layout: z.enum(Enum.values(ViewLayout)).default(ViewLayout.Table),
    layoutBy: PATH.exactOptional(),
    filter: z.record(z.string(), z.unknown()).default(() => ({})),
    sort: z.object({ key: PATH, direction: z.enum(Enum.values(SortDirection)) }).exactOptional(),
    columns: z.array(PATH).exactOptional(),
    // oxlint-disable-next-line unicorn/no-thenable -- reason: `then` is the saved view's sub-group key, not a promise
    group: z.object({ by: PATH, then: PATH.exactOptional() }).exactOptional(),
    totals: z
      .array(z.object({ key: PATH, aggregate: z.enum(Enum.values(Aggregate)) }))
      .default(() => []),
  })
  .superRefine((view, issues) => {
    if (view.sharing === ViewSharing.Role && view.role === undefined)
      issues.addIssue({ code: "custom", path: ["role"], message: "a role copy names its role" });
    if (LAID_OUT_BY.has(view.layout) && view.layoutBy === undefined)
      issues.addIssue({
        code: "custom",
        path: ["layoutBy"],
        message: "a board or calendar names the path it is laid out by",
      });
  });
