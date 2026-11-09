/**
 * Stackra file contract:
 * Purpose: `AUTOMATION_RUN_SKIPPED_SCHEMA`, the zod schema of `AutomationRunSkipped` that this package ships (its `X$`).
 * Boundary: the stand-in for what gen will write for this package. Internal: `automation-run-skipped.event.ts`
 *           registers it, and it is not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0122 (decision 3).
 */
import { publicId } from "@stackra/validation";
import { z } from "zod";

/** The shipped `AutomationRunSkipped$`. */
export const AUTOMATION_RUN_SKIPPED_SCHEMA = z.object({
  automationId: publicId("wfa"),
  key: z.string().min(1),
  reason: z.enum(["quota_exceeded", "quota_unavailable"]),
  startedBy: z.enum(["event", "schedule"]),
});
