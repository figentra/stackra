/**
 * Stackra file contract:
 * Purpose: `RESOURCE_REGISTRY`, the recorded resource trees by resource key (`orders.order`) that the generic resource
 *          pages read.
 * Boundary: internal; written only by `registerResources`, read by `resourceTreeOf`. Holds data, never classes of a
 *           service: the generated web entry passes the trees gen wrote into `#stackra/resources`.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 5: gen records each tree); ADR 0164.
 */
import type { ResourceTree } from "#core/types/resource-tree.type";

/** The registered trees, by resource key. */
export const RESOURCE_REGISTRY = new Map<string, ResourceTree>();
