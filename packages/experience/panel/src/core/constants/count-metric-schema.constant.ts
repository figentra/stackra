/**
 * Stackra file contract:
 * Purpose: `COUNT_METRIC_SCHEMA`, the zod schema of `CountMetric` this package ships (its `X$`): a whole-number value
 *          and previous value, the per-bucket series and the target, each nullable.
 * Boundary: the stand-in for what gen will write for this package; a generated output schema reuses it for a field
 *           typed `CountMetric` (`orders: CountMetric$`). The entry exports it as `CountMetric$`, and the class
 *           carries it as `CountMetric.schema`.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 15 and 16: metric shapes in the core entry); ADR 0294 (decision 26: a package
 *                     ships its own `X$`).
 */
import { z } from "zod";

/** The shipped `CountMetric$`. */
export const COUNT_METRIC_SCHEMA = z.object({
  value: z.number().int().nullable(),
  previous: z.number().int().nullable(),
  series: z.array(z.number().int()).nullable(),
  target: z.number().int().nullable(),
});
