/**
 * Stackra file contract:
 * Purpose: `RUN_COMPLETED_SCHEMA`, the zod schema this package ships for `RunCompleted`: the run, the agent, how it
 *          ended, the steps it took and a failed run's error code.
 * Boundary: the stand-in for what gen will write for this package; internal, registered by the event file. No text.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decisions 9 and 11); ADR 0294 (decision 26).
 */
import { publicId } from "@stackra/validation";
import { z } from "zod";

/** The shipped `RunCompleted$`. */
export const RUN_COMPLETED_SCHEMA = z.object({
  runId: publicId("airun"),
  agent: z.string().min(1),
  status: z.enum(["completed", "failed"]),
  steps: z.number().int().min(0),
  errorCode: z.string().min(1).nullable(),
});
