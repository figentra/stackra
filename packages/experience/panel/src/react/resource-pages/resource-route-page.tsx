/**
 * Stackra file contract:
 * Purpose: `ResourceRoutePage`, the page navigation renders for every resource route (`toResource(Resources.Order)`): the
 *          generic List, View, Create or Edit page by the route's page name (panel's `ResourcePage` codes).
 * Boundary: internal to the `./react` entry; registered by `registerPanelPages` as navigation's `resource` page, so
 *           every resource has its pages with no code of its own. Navigation hands the resource as data; it is the
 *           route constants `resource(key, options)` built.
 * Runtime: browser
 * Governing contract: ADR 0307 (resource pages); ADR 0164 (decision 3).
 */
import type { ReactElement } from "react";

import type { ResourceRoutes } from "#core/types/resource-routes.type";
import { ResourceFormPage } from "#react/resource-pages/resource-form-page";
import { ResourceListPage } from "#react/resource-pages/resource-list-page";
import { ResourceViewPage } from "#react/resource-pages/resource-view-page";

/**
 * The page `page` of `resource`.
 *
 * @example
 * registerRoutePages({ resource: ResourceRoutePage });
 */
export function ResourceRoutePage({
  resource,
  page,
}: {
  readonly resource: object;
  readonly page: "list" | "view" | "create" | "edit";
}): ReactElement {
  const routes = resource as ResourceRoutes;
  if (page === "list") return <ResourceListPage resource={routes} />;
  if (page === "view") return <ResourceViewPage resource={routes} />;
  return <ResourceFormPage resource={routes} mode={page} />;
}
