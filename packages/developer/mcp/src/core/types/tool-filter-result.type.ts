/**
 * Stackra file contract:
 * Purpose: `ToolFilterResult`, the per-caller view of the tool table: the tools the caller may list, each with its
 *          `locked` marker (the tenant is not entitled to it).
 * Boundary: a type only; `filterTools` builds it. A locked tool is listed but answered with "requires subscription"
 *           and an upgrade path by the gateway, never run.
 * Runtime: isomorphic
 * Governing contract: ADR 0155 (decisions 3 and 4); STA-784 (the marker replaces the separate locked list).
 */
import type { ListedTool } from "#core/types/listed-tool.type";

/** The tools of one caller in one tenant. */
export type ToolFilterResult = {
  /** The tools the caller may list, in table order; `locked` on the ones the plan lacks. */
  readonly tools: readonly ListedTool[];
};
