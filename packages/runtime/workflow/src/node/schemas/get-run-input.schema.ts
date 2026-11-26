/**
 * Stackra file contract:
 * Purpose: `GetRunInput`, the input of `workflow.run.get`: the run's public id.
 * Boundary: a schema class; registered with its Zod shape here until gen writes the package's registration.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-2613.
 */
import type { PublicId } from "@stackra/contracts";
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/** The run asked for. */
export class GetRunInput extends Schema {
  /** The run's public id, as `ctx.run` or the run's events name it. */
  runId!: PublicId<"wfr">;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[GetRunInput, z.object({ runId: z.string().regex(/^wfr_[0-9A-Za-z]{26}$/) })]]);
