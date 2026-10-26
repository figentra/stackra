/**
 * Stackra file contract:
 * Purpose: `filterTools`, the per-caller filter of the hosted MCP server: a tool the caller lacks the permission for
 *          (with their roles, on their record) is dropped; a tool the AI permission matrix sets to off for that role
 *          and record is dropped (off = not registered); a tool the caller may use but the tenant is not entitled to
 *          is listed with the `locked` marker, so the gateway answers a call to it with "requires subscription".
 * Boundary: pure over the `ToolAccess` answers the host passes; the matrix's other states (suggest, after approval,
 *           on its own) and the never-bypass floor apply when a call runs, in the approval resolver and the action
 *           pipeline, never here.
 * Runtime: isomorphic
 * Governing contract: ADR 0155 (decisions 1, 3 and 4); ADR 0360 (decision 2: an agent never has access its human
 *                     lacks); R3-SO-02 and J2-6 (by role and record; off = not registered).
 */
import type { HostedTool } from "#core/types/hosted-tool.type";
import type { ListedTool } from "#core/types/listed-tool.type";
import type { ToolAccess } from "#core/types/tool-access.type";
import type { ToolFilterResult } from "#core/types/tool-filter-result.type";
import type { ToolScope } from "#core/types/tool-scope.type";

/**
 * The tools one caller may list where they act.
 *
 * @param tools - the tool table.
 * @param access - the caller's permission, matrix and entitlement answers.
 * @param scope - the caller's roles and record; no roles and no record when absent.
 * @example
 * const { tools } = filterTools(table, access, { roles: ["associate"], record: { kind: "matter", id: "mtr_1" } });
 */
export function filterTools(
  tools: readonly HostedTool[],
  access: ToolAccess,
  scope: ToolScope = { roles: [] },
): ToolFilterResult {
  const listed: ListedTool[] = [];
  for (const tool of tools) {
    if (!access.can(tool.permission, scope)) continue;
    if (access.isOff?.(tool, scope) === true) continue;
    listed.push({ ...tool, locked: !access.isEntitled(tool) });
  }
  return { tools: listed };
}
