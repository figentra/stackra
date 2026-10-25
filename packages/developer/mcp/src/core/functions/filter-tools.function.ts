/**
 * Stackra file contract:
 * Purpose: `filterTools`, the per-tenant filter of the hosted MCP server: a tool the caller lacks the permission for
 *          is dropped; a tool the caller may use but the tenant is not entitled to is held back and named in `locked`,
 *          so the gateway answers a call to it with "requires subscription" and an upgrade path.
 * Boundary: pure over the `ToolAccess` answers the host passes; approval modes and the never-bypass floor are applied
 *           when a call runs, in the action pipeline, never here.
 * Runtime: isomorphic
 * Governing contract: ADR 0155 (decisions 1, 3 and 4); ADR 0360 (decision 2: an agent never has access its human
 *                     lacks).
 */
import type { HostedTool } from "#core/types/hosted-tool.type";
import type { ToolAccess } from "#core/types/tool-access.type";
import type { ToolFilterResult } from "#core/types/tool-filter-result.type";

/**
 * The tools one caller may list in one tenant.
 *
 * @param tools - the tool table.
 * @param access - the caller's permission and the tenant's entitlement answers.
 * @example
 * const { tools, locked } = filterTools(table, { can: (p) => grants.has(p), isEntitled: (t) => plan.has(t.name) });
 */
export function filterTools(tools: readonly HostedTool[], access: ToolAccess): ToolFilterResult {
  const allowed: HostedTool[] = [];
  const locked: string[] = [];
  for (const tool of tools) {
    if (!access.can(tool.permission)) continue;
    if (access.isEntitled(tool)) allowed.push(tool);
    else locked.push(tool.name);
  }
  return { tools: allowed, locked };
}
