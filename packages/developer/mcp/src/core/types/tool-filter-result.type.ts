/**
 * Stackra file contract:
 * Purpose: `ToolFilterResult`, the per-tenant view of the tool table: the tools the caller may list and call, and
 *          the names the caller could use but the tenant is not entitled to.
 * Boundary: a type only; `filterTools` builds it. A locked name is answered with "requires subscription" and an
 *           upgrade path by the gateway, never listed as a callable tool.
 * Runtime: isomorphic
 * Governing contract: ADR 0155 (decisions 3 and 4).
 */
import type { HostedTool } from "#core/types/hosted-tool.type";

/** The tools of one caller in one tenant. */
export type ToolFilterResult = {
  /** The tools the caller may list and call, in table order. */
  readonly tools: readonly HostedTool[];

  /** Tools the caller has the permission for but the tenant is not entitled to, by name. */
  readonly locked: readonly string[];
};
