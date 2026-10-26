/**
 * Stackra file contract:
 * Purpose: `RunStatus`, where one agent run stands: queued, running, waiting for an approval, completed or failed.
 * Boundary: an enum (`Enum.of`), snake_case codes (ADR 0231), stored in `ai.runs.status`. A run waiting for an approval
 *           holds the parked tool call; `resume` takes it back to running.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decisions 2 and 10: prompt, stream, queue, resume; `ai_runs`).
 */
import { Enum } from "@stackra/contracts";

/**
 * A run's status.
 *
 * @example
 * if (reply.status === RunStatus.WaitingApproval) showApproval(reply.pending);
 */
export const RunStatus = Enum.of({
  /** Accepted by `queue`, not started yet. */
  Queued: "queued",
  /** The model loop is running. */
  Running: "running",
  /** Parked on a tool call that needs an approval. */
  WaitingApproval: "waiting_approval",
  /** Finished with an answer. */
  Completed: "completed",
  /** Ended by an error or a refusal outside a tool call. */
  Failed: "failed",
});

/** One of the codes above. */
export type RunStatus = Enum.Value<typeof RunStatus>;
