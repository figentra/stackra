/**
 * Stackra file contract:
 * Purpose: the `AgentQueue` port: hands a queued agent run to a worker, which runs it with `AgentRuntime.runQueued`.
 * Boundary: an abstract class that is its own token, keyed `ai.AgentQueue`. The ai service binds it to its queue
 *           (`@stackra/queue`); the run, its conversation and its prompt are already stored, so only the run id travels.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decision 2: `queue`); STA-781.
 */
import { Port } from "@stackra/contracts";

/**
 * Queues agent runs.
 *
 * @example
 * export class QueueAgentQueueDriver extends Driver(AgentQueue) {
 *   enqueue(runId: string): Promise<void> {
 *     return this.jobs.dispatch(RunAgentAction, { runId });
 *   }
 * }
 */
export abstract class AgentQueue extends Port {
  /** Type-only port key, so `DriverName<AgentQueue>` narrows to this port's drivers. */
  declare readonly "~key": "ai.AgentQueue";

  /** Queues the stored run `runId` of the agent `agent`. */
  abstract enqueue(runId: string, agent: string): Promise<void>;
}
