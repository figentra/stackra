/**
 * Stackra file contract:
 * Purpose: `ResourceListPageProps`, the props of the generic List page.
 * Boundary: props only; the resource is its route constants from `resource(key, options)`.
 * Runtime: browser
 * Governing contract: ADR 0307; ADR 0164.
 */
import type { ResourceRoutes } from "#core/types/resource-routes.type";

/** Props of `ResourceListPage`. */
export interface ResourceListPageProps {
  /** The resource's route constants (`Resources.Order`); its `operations.list` is the list query ref. */
  readonly resource: ResourceRoutes;

  /** How many rows a page holds; a host setting, 25 when absent. */
  readonly pageSize?: number;
}
