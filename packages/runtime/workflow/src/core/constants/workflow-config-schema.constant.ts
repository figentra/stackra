/**
 * Stackra file contract:
 * Purpose: `WORKFLOW_CONFIG_SCHEMA`, the shipped zod schema of the workflow configuration (`WorkflowConfig$`): the
 *          journal driver, `postgres` by default; the signal retention, `7d` by default, from 1 minute to 90 days;
 *          the for-each limit, 1,000 by default; and the event chain depth, 3 by default.
 * Boundary: mirrors `WorkflowEngineOptions` by hand until gen compiles this package's schemas; change both together.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 26: a package ships its compiled `X$`); ADR 0292 (decision 2); ADR 0427
 *                     (decision 2); OS-232.
 */
import { Duration } from "@stackra/contracts";
import { duration } from "@stackra/validation";
import { z } from "zod";

import { WORKFLOW_JOURNALS } from "#core/constants/workflow-journals.constant";

/** The shipped `WorkflowConfig$`. */
export const WORKFLOW_CONFIG_SCHEMA = z.object({
  journal: z.enum(WORKFLOW_JOURNALS).default("postgres"),
  signalRetention: z
    .string()
    .refine((text) => {
      try {
        const milliseconds = Duration.toMilliseconds(duration(text));
        return milliseconds >= 60_000 && milliseconds <= 90 * 86_400_000;
      } catch {
        return false;
      }
    }, "Expected a duration from 1m to 90d, such as 7d")
    .default("7d"),
  forEachLimit: z.int().min(1).max(10_000).default(1000),
  maxChainDepth: z.int().min(1).max(20).default(3),
});
