/**
 * Stackra file contract:
 * Purpose: `ResourceListPageProps`, the props of the native generic List page: the web page's own.
 * Boundary: props only; the resource is its route constants from `resource(key, options)`, always given (gen registers no
 *           resource screens on native yet).
 * Runtime: react-native
 * Governing contract: ADR 0307; ADR 0164 (native parity); ADR 0359 (decision 14).
 */
import type { ViewStore } from "#core/ports/view-store.port";
import type { ResourceRoutes } from "#core/types/resource-routes.type";

/** Props of the native `ResourceListPage`. */
export interface ResourceListPageProps {
  /** The resource's route constants (`Resources.Order`); its `operations.list` is the list query ref. */
  readonly resource: ResourceRoutes;

  /** How many rows a page holds; a host setting, 25 when absent. */
  readonly pageSize?: number;

  /** Where the viewer's saved views are read; absent, the list draws without saved view tabs. */
  readonly views?: ViewStore | undefined;
}
