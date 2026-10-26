/**
 * Stackra file contract:
 * Purpose: `WORKFLOW_RUN_ENDED_SCHEMA`, the zod schema of `WorkflowRunEnded` that this package ships (its `X$`).
 * Boundary: the stand-in for what gen will write for this package. Internal: `workflow-run-ended.event.ts` registers
 *           it, and it is not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0152 (decision 4: operations).
 */
import { Enum } from "@stackra/contracts";
import { publicId } from "@stackra/validation";
import { z } from "zod";

import { WorkflowRunStatus } from "#core/enums/workflow-run-status.enum";

/** The shipped `WorkflowRunEnded$`. */
export const WORKFLOW_RUN_ENDED_SCHEMA = z.object({
  runId: publicId("wfr"),
  workflow: z.string().min(1),
  version: z.int().min(1),
  automationId: publicId("wfa").exactOptional(),
  status: z.enum(Enum.values(WorkflowRunStatus)),
  error: z.object({ code: z.string().min(1), message: z.string() }).exactOptional(),
});
