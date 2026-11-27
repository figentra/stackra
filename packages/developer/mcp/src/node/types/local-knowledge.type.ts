/**
 * Stackra file contract:
 * Purpose: `LocalKnowledge`, what the local MCP's resources and prompts are made from: the repository root (where the
 *          committed manifests are read), the open agent documents of `@stackra/skills` (rules and skills), and the
 *          names of the tools the server offers, so a recipe names only tools that exist.
 * Boundary: type only; `serveLocalMcp` builds it once per request from its options.
 * Runtime: node
 * Governing contract: ADR 0282 (decisions 2, 5 and 6); STA-2919.
 */
import type { AgentDocument } from "@stackra/skills";

/** The inputs of the local resources and prompts. */
export type LocalKnowledge = {
  /** The repository root; manifests are read under it on every call, so they follow `stackra gen`. */
  readonly root: string;
  /** The layer-1 agent documents: rules and skills are served, other kinds are ignored. */
  readonly documents: readonly AgentDocument[];
  /** Every tool name the server lists, the proxied Encore tools aside. */
  readonly tools: ReadonlySet<string>;
};
