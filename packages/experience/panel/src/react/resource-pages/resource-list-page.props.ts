/**
 * Stackra file contract:
 * Purpose: `ResourceListPageProps`, the props of the generic List page.
 * Boundary: props only; the resource is its route constants from `resource(key, options)`.
 * Runtime: browser
 * Governing contract: ADR 0307; ADR 0164; ADR 0359 (decision 14).
 */
import type { ViewStore } from "#core/ports/view-store.port";
import type { ResourceRoutes } from "#core/types/resource-routes.type";

/** Props of `ResourceListPage`. */
export interface ResourceListPageProps {
  /** The resource's route constants (`Resources.Order`); its `operations.list` is the list query ref. */
  readonly resource: ResourceRoutes;

  /** How many rows a page holds; a host setting, 25 when absent. */
  readonly pageSize?: number;

  /** Where the viewer's saved views are read; absent, the list draws without saved view tabs. */
  readonly views?: ViewStore | undefined;
}
