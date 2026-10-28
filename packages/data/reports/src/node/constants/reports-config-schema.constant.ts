/**
 * Stackra file contract:
 * Purpose: `REPORTS_CONFIG_SCHEMA`, the zod schema of the report runner's configuration (`ReportsConfig$`): the page
 *          size when a request names none, the row cap (the most groups one run reads), the statement timeout and
 *          whether runs go to the read replica, and the report engine runs execute on (`postgres`).
 * Boundary: the stand-in for what gen will write for this package. Defaults only; a host or runway layer overrides them.
 * Runtime: isomorphic
 * Governing contract: ADR 0363 (configuration, not code); ADR 0470 (decision 3: replica by default, timeout, row cap;
 *                     decision 8: the engine is configuration).
 */
import { Duration } from "@stackra/contracts";
import { z } from "zod";

import { REPORT_ENGINES } from "#node/constants/report-engines.constant";

/** A duration in either form, stored canonical. */
const DURATION = z.string().transform((text, context): Duration => {
  try {
    return Duration.parse(text);
  } catch {
    context.addIssue({
      code: "custom",
      message: `"${text}" is not a duration such as PT30S or 30s`,
    });
    return z.NEVER;
  }
});

/** The shipped `ReportsConfig$`. */
export const REPORTS_CONFIG_SCHEMA = z.object({
  pageSize: z.number().int().min(1).max(10_000).default(100),
  maxRows: z.number().int().min(1).max(100_000).default(10_000),
  timeout: DURATION.default(Duration.seconds(30)),
  replica: z.boolean().default(true),
  engine: z.enum(REPORT_ENGINES).default("postgres"),
});
