/**
 * Stackra file contract:
 * Purpose: `AgentClass`, the class type `Agent({...})` gives and every agent class fits, so a consumer's declaration
 *          emit can name it.
 * Boundary: a type only (ADR 0294 decision 25). Its constructor takes the `AgentRuntime` it runs on.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 25); STA-781.
 */
import type { Promptable } from "#core/bases/promptable.base";
import type { AgentRuntime } from "#core/services/agent-runtime.service";

/** An agent class. */
export type AgentClass = new (runtime: AgentRuntime) => Promptable;
