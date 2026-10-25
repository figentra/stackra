/**
 * Stackra file contract:
 * Purpose: `ToolAccess`, what the hosted server asks about one caller in one tenant before it lists or runs a tool:
 *          whether the caller holds the permission, and whether the tenant is entitled to the tool.
 * Boundary: a type only. The answers come from the IAM decision point and the entitlements service of the host; this
 *           package never decides either itself.
 * Runtime: isomorphic
 * Governing contract: ADR 0155 (decisions 1, 3 and 4: the caller's own permissions; "requires subscription").
 */
import type { HostedTool } from "#core/types/hosted-tool.type";

/** One caller's access in one tenant. */
export type ToolAccess = {
  /** Whether the caller (for an agent: its human's grants intersected with its own) holds the permission. */
  readonly can: (permission: string) => boolean;

  /** Whether the tenant's plan includes the tool. */
  readonly isEntitled: (tool: HostedTool) => boolean;
};
