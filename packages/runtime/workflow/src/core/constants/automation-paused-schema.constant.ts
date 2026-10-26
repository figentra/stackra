/**
 * Stackra file contract:
 * Purpose: `AUTOMATION_PAUSED_SCHEMA`, the zod schema of `AutomationPaused` that this package ships (its `X$`).
 * Boundary: the stand-in for what gen will write for this package. Internal: `automation-paused.event.ts` registers it,
 *           and it is not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0423 (decision 2).
 */
import { publicId } from "@stackra/validation";
import { z } from "zod";

/** The shipped `AutomationPaused$`. */
export const AUTOMATION_PAUSED_SCHEMA = z.object({
  automationId: publicId("wfa"),
  key: z.string().min(1),
  reason: z.string().min(1),
  blocks: z.array(z.string().min(1)),
});
