/**
 * Stackra file contract:
 * Purpose: `TIME_RANGE_INPUT_SCHEMA`, the zod schema of `TimeRangeInput` this package ships (its `X$`): a named range
 *          (today by default), the custom `from` and `to`, and whether the answer carries the previous period.
 * Boundary: the stand-in for what gen will write for this package; a subclass with no field of its own reuses it
 *           (`OrderKpisInput$ = TimeRangeInput$`). The custom range needs `from`, and `to` is after `from`.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 14 and 20: ranges); ADR 0294 (decision 26: the `Date` codec).
 */
import { Enum } from "@stackra/contracts";
import { isoDateTime } from "@stackra/validation";
import { z } from "zod";

import { TimeRange } from "#core/enums/time-range.enum";

/** The shipped `TimeRangeInput$`. */
export const TIME_RANGE_INPUT_SCHEMA = z
  .object({
    range: z.enum(Enum.values(TimeRange)).default(TimeRange.Today),
    from: isoDateTime().exactOptional(),
    to: isoDateTime().exactOptional(),
    compare: z.boolean().default(true),
  })
  .superRefine((input, issues) => {
    if (input.range === TimeRange.Custom && input.from === undefined)
      issues.addIssue({ code: "custom", path: ["from"], message: "A custom range needs a start" });
    if (input.from !== undefined && input.to !== undefined && input.to <= input.from)
      issues.addIssue({ code: "custom", path: ["to"], message: "The end must be after the start" });
  });
