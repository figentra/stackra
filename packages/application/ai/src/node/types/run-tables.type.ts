/**
 * Stackra file contract:
 * Purpose: `RunTables`, the four run repositories a run's erasure removes rows from, children first.
 * Boundary: a type only; the Postgres stores pass their own repositories.
 * Runtime: node
 * Governing contract: ADR 0100 (decision 9); ADR 0294 (as amended by programming model v3.1, AGENTS.md)
 */
import type { Repository } from "@stackra/database";

import type { RunApproval } from "#node/models/run-approval.model";
import type { RunStep } from "#node/models/run-step.model";
import type { Run } from "#node/models/run.model";
import type { ToolCall } from "#node/models/tool-call.model";

/** The run repositories, by table. */
export interface RunTables {
  /** `ai.runs`. */
  readonly runs: Repository<Run>;

  /** `ai.run_steps`. */
  readonly steps: Repository<RunStep>;

  /** `ai.tool_calls`. */
  readonly calls: Repository<ToolCall>;

  /** `ai.run_approvals`. */
  readonly decisions: Repository<RunApproval>;
}
