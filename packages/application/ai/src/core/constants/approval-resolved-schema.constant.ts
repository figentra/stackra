/**
 * Stackra file contract:
 * Purpose: `APPROVAL_RESOLVED_SCHEMA`, the zod schema this package ships for `ApprovalResolved`: the run, the approval
 *          id, the action and whether it was granted or denied.
 * Boundary: the stand-in for what gen will write for this package; internal, registered by the event file. No text.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decisions 9 and 11); ADR 0294 (decision 26).
 */
import { publicId } from "@stackra/validation";
import { z } from "zod";

/** The shipped `ApprovalResolved$`. */
export const APPROVAL_RESOLVED_SCHEMA = z.object({
  runId: publicId("airun"),
  approvalId: z.string().min(1),
  tool: z.string().min(1),
  status: z.enum(["granted", "denied"]),
});
