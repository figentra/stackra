/**
 * Stackra file contract:
 * Purpose: `registerResources(trees)`, how a member's generated web entry hands its recorded resource trees (table,
 *          form, infolist, relations, placed actions) to the generic resource pages.
 * Boundary: writes `RESOURCE_REGISTRY` and returns the disposer that takes exactly these entries back. A resource with
 *           no registered tree still gets every page: the pages derive columns, entries and fields from the wire data.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 5); ADR 0164; the `registerWidgets` precedent.
 */
import { RESOURCE_REGISTRY } from "#core/constants/resource-registry.constant";
import type { ResourceTree } from "#core/types/resource-tree.type";

/**
 * Registers `trees` by resource key.
 *
 * @example
 * registerResources({ "orders.order": OrderResourceTree }); // in the generated web entry, beside registerPanelPages()
 */
export function registerResources(trees: Readonly<Record<string, ResourceTree>>): () => void {
  for (const [key, tree] of Object.entries(trees)) RESOURCE_REGISTRY.set(key, tree);
  return () => {
    for (const [key, tree] of Object.entries(trees))
      if (RESOURCE_REGISTRY.get(key) === tree) RESOURCE_REGISTRY.delete(key);
  };
}
