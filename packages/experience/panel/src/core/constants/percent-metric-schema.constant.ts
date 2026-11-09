/**
 * Stackra file contract:
 * Purpose: `PERCENT_METRIC_SCHEMA`, the zod schema of `PercentMetric` this package ships (its `X$`): a ratio for the
 *          value, the previous value, each bucket of the series and the target, each nullable, and the `percent` format
 *          mark the renderers read.
 * Boundary: the stand-in for what gen will write for this package; a generated output schema reuses it for a field
 *           typed `PercentMetric` (`deliveredRate: PercentMetric$`). The entry exports it as `PercentMetric$`, and the
 *           class carries it as `PercentMetric.schema`. A ratio is unbounded: an attainment may pass 1 and a margin may
 *           fall below 0.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 15 and 16: metric shapes in the core entry); ADR 0294 (decision 26: a package
 *                     ships its own `X$`).
 */
import { z } from "zod";

/** The shipped `PercentMetric$`. */
export const PERCENT_METRIC_SCHEMA = z.object({
  value: z.number().nullable(),
  previous: z.number().nullable(),
  series: z.array(z.number()).nullable(),
  target: z.number().nullable(),
  format: z.literal("percent"),
});
