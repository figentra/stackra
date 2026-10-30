/**
 * Stackra file contract:
 * Purpose: `RunStatus`, where one agent run stands: queued, running, waiting for an approval, waiting for a client tool, completed or failed.
 * Boundary: an enum (`Enum.of`), snake_case codes (ADR 0231), stored in `ai.runs.status`. A run waiting for an approval
 *           holds the parked tool call; `resume` takes it back to running. A run waiting for a client tool holds the
 *           call and its surface until the surface answers or the wait ends.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decisions 2 and 10: prompt, stream, queue, resume; `ai_runs`); ADR 0490 (decision 4); STA-1631.
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
  /** Parked on a client tool call the viewer's screen answers. */
  WaitingClientTool: "waiting_client_tool",
  /** Finished with an answer. */
  Completed: "completed",
  /** Ended by an error or a refusal outside a tool call. */
  Failed: "failed",
});

/** One of the codes above. */
export type RunStatus = Enum.Value<typeof RunStatus>;
