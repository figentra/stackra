/**
 * Stackra file contract:
 * Purpose: `resourceTreeOf(key)`, the registered tree of a resource, or an empty one, so every resource route has a
 *          page with no extra code.
 * Boundary: internal; reads `RESOURCE_REGISTRY` only. An empty tree means "derive from the data": the pages then show
 *           the row's, record's and input's own keys.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 5); ADR 0164.
 */
import { RESOURCE_REGISTRY } from "#core/constants/resource-registry.constant";
import type { ResourceTree } from "#core/types/resource-tree.type";

/** The tree a resource without a registration gets. */
const EMPTY: Partial<ResourceTree> = Object.freeze({});

/**
 * The tree of the resource `key`.
 *
 * @example
 * resourceTreeOf("orders.order").table?.columns; // the recorded columns, or undefined to derive them
 */
export function resourceTreeOf(key: string): Partial<ResourceTree> {
  return RESOURCE_REGISTRY.get(key) ?? EMPTY;
}
