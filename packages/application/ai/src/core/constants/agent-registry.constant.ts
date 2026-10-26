/**
 * Stackra file contract:
 * Purpose: `AGENT_REGISTRY`, every agent `Agent({...})` declared, by key, so a queued or parked run (which stores only
 *          the agent's key) finds its definition in the worker that resumes it.
 * Boundary: filled when an agent class is declared, read by `AgentRuntime.runQueued` and `resume`. A key declared twice
 *           keeps the later definition; gen locks keys in the manifest, so a duplicate never ships.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decision 2: queue and resume); STA-781.
 */
import type { AgentDefinition } from "#core/types/agent-definition.type";

/** The declared agents by key. */
export const AGENT_REGISTRY = new Map<string, AgentDefinition>();
