/**
 * Stackra file contract:
 * Purpose: `AgentOptions`, what `Agent({...})` takes: the agent's key, the task type its model is routed by, the
 *          action and query classes it may call as tools, and the most model steps one run may take.
 * Boundary: a type only. No instructions, model, provider or approval rule here: instructions are the agent's
 *           versioned prompt document (`InstructionSource`), the model is routed per tenant (`AgentModels`), and what a
 *           tool may do is IAM, the permission matrix and the floor, at run time.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decisions 2 and 3); ADR 0245 (prompts are documents); ADR 0156 (decision 2); STA-781.
 */
import type { AnyClass } from "@stackra/container";

/** The options of an agent. */
export interface AgentOptions {
  /** The agent's key, snake_case (`matter_assistant`), written once; its conversations and runs carry it. */
  readonly key: string;

  /** The task type the model router chooses its model by (`chat`). */
  readonly task: string;

  /** The action and query classes it may call; each must be an exposed tool. None when absent. */
  readonly tools?: readonly AnyClass[];

  /** The most model steps one run takes before it stops; 8 when absent. */
  readonly maxSteps?: number;
}
