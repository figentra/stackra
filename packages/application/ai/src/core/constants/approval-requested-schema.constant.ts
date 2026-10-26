/**
 * Stackra file contract:
 * Purpose: `APPROVAL_REQUESTED_SCHEMA`, the zod schema this package ships for `ApprovalRequested`: the run, the agent,
 *          the approval id and the action the parked tool call dispatches.
 * Boundary: the stand-in for what gen will write for this package; internal, registered by the event file. No prompt,
 *           response or tool input (ADR 0100 decision 9: runs keep hashes, never text).
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decisions 9 and 11); ADR 0294 (decision 26).
 */
import { publicId } from "@stackra/validation";
import { z } from "zod";

/** The shipped `ApprovalRequested$`. */
export const APPROVAL_REQUESTED_SCHEMA = z.object({
  runId: publicId("airun"),
  agent: z.string().min(1),
  approvalId: z.string().min(1),
  tool: z.string().min(1),
});
