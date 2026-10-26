/**
 * Stackra file contract:
 * Purpose: `AgentDefinition`, an agent's options with their defaults applied, as `AgentRuntime` runs them and
 *          `AGENT_REGISTRY` keeps them by key for queued and resumed runs.
 * Boundary: a type only; `Agent({...})` builds it once per class.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decision 2); STA-781.
 */
import type { AnyClass } from "@stackra/container";

/** A checked agent. */
export interface AgentDefinition {
  /** The agent's key. */
  readonly key: string;

  /** The routed task type. */
  readonly task: string;

  /** The tool classes. */
  readonly tools: readonly AnyClass[];

  /** The step limit of one run. */
  readonly maxSteps: number;
}
