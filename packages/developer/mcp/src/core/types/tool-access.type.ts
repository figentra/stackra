/**
 * Stackra file contract:
 * Purpose: `ToolAccess`, what the hosted server asks about one caller in one tenant before it lists or runs a tool:
 *          whether the caller holds the permission where they act (by role and record), whether the AI permission
 *          matrix turns the tool off for them, and whether the tenant is entitled to the tool.
 * Boundary: a type only. The answers come from the IAM decision point, the `rule-set:os:ai-action-permissions` rows
 *           and the entitlements service of the host; this package never decides any of them itself.
 * Runtime: isomorphic
 * Governing contract: ADR 0155 (decisions 1, 3 and 4: the caller's own permissions; "requires subscription");
 *                     R3-SO-02 and J2-6 (off = the tool is not registered for that role and record).
 */
import type { HostedTool } from "#core/types/hosted-tool.type";
import type { ToolScope } from "#core/types/tool-scope.type";

/** One caller's access in one tenant. */
export type ToolAccess = {
  /**
   * Whether the caller (for an agent: its human's grants intersected with its own) holds the permission with
   * `scope`'s roles, on `scope`'s record when there is one.
   */
  readonly can: (permission: string, scope: ToolScope) => boolean;

  /** Whether the AI permission matrix sets the tool to off for `scope`; never off when absent. */
  readonly isOff?: (tool: HostedTool, scope: ToolScope) => boolean;

  /** Whether the tenant's plan includes the tool. */
  readonly isEntitled: (tool: HostedTool) => boolean;
};
