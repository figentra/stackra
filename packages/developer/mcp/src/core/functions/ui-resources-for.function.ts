/**
 * Stackra file contract:
 * Purpose: `uiResourcesFor`, the `ui://` resources one caller may list: those a tool the caller may list names, so a
 *          resource never shows what its tool would refuse.
 * Boundary: pure over `filterTools`' output. A locked tool keeps its resource listed (the host shows the upgrade path);
 *           a resource no listed tool names is left out.
 * Runtime: isomorphic
 * Governing contract: ADR 0348 (decisions 1 and 2); ADR 0155 (decision 3); STA-784.
 */
import type { ListedTool } from "#core/types/listed-tool.type";
import type { UiResource } from "#core/types/ui-resource.type";

/**
 * The resources `tools` name.
 *
 * @example
 * const { tools } = filterTools(table, access, scope);
 * const resources = uiResourcesFor(uiResourceTable(manifests), tools);
 */
export function uiResourcesFor(
  resources: readonly UiResource[],
  tools: readonly ListedTool[],
): UiResource[] {
  const named = new Set(tools.flatMap((tool) => (tool.ui === undefined ? [] : [tool.ui])));
  return resources.filter((resource) => named.has(resource.uri));
}
