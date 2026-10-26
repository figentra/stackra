/**
 * Stackra file contract:
 * Purpose: `CHECKLIST_COMPLETED_SCHEMA`, the zod schema of `ChecklistCompleted` that this package ships (its `X$`).
 * Boundary: the stand-in for what gen will write for this package. Internal: `checklist-completed.event.ts` registers
 *           it, and it is not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0424 (decision 3).
 */
import { publicId } from "@stackra/validation";
import { z } from "zod";

/** The shipped `ChecklistCompleted$`. */
export const CHECKLIST_COMPLETED_SCHEMA = z.object({
  checklistId: publicId("wfc"),
  key: z.string().min(1),
  userId: z.string().min(1).nullable(),
});
