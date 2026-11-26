/**
 * Stackra file contract:
 * Purpose: `GetRunOutput`, what `workflow.run.get` answers: the run's status, when it ended, and its workflow's output
 *          so far; never its steps, their results or its input.
 * Boundary: a schema class; registered with its Zod shape here until gen writes the package's registration.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-2613.
 */
import type { Json, PublicId } from "@stackra/contracts";
import { Enum } from "@stackra/contracts";
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import { WorkflowRunStatus } from "#core/enums/workflow-run-status.enum";

/** A run as its caller sees it. */
export class GetRunOutput extends Schema {
  /** The run's public id. */
  runId!: PublicId<"wfr">;

  /** Where the run stands: running, waiting (a parked wait or retry), completed, compensating, compensated, failed. */
  status!: WorkflowRunStatus;

  /** When it completed, compensated or failed; null while it runs or waits. */
  endedAt!: Date | null;

  /** The workflow's output over the results so far; null when it has none yet. */
  output!: Json | null;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    GetRunOutput,
    z.object({
      runId: z.string(),
      status: z.enum(Enum.values(WorkflowRunStatus) as [WorkflowRunStatus, ...WorkflowRunStatus[]]),
      endedAt: z.date().nullable(),
      output: z.unknown().nullable(),
    }),
  ],
]);
