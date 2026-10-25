/**
 * Stackra file contract:
 * Purpose: `RegisteredRoutePage`, the element of a panel, resource, settings-page or document route: the component
 *          registered for its kind, rendered with the route's props.
 * Boundary: internal; looks the component up when it renders, so a registration made after the route tree was built
 *           still applies. A kind nobody registered throws, naming the missing registration, for the error boundary.
 * Runtime: browser
 * Governing contract: ADR 0307; ADR 0110.
 */
import type { ComponentType, ReactElement } from "react";

import { ROUTE_PAGES } from "#react/route-pages/route-pages.constant";
import type { RoutePages } from "#react/route-pages/route-pages.type";

/**
 * The registered page of `kind` with `props`.
 *
 * @throws Error when no package registered a page of `kind`.
 * @example
 * element: <RegisteredRoutePage kind="panel" props={{ panel: CustomerPortalPanel }} />
 */
export function RegisteredRoutePage({
  kind,
  props,
}: {
  readonly kind: keyof RoutePages;
  readonly props: object;
}): ReactElement {
  const Page = ROUTE_PAGES[kind] as ComponentType<object> | undefined;
  if (Page === undefined)
    throw new Error(`No ${kind} page is registered; its package calls registerRoutePages`);
  return <Page {...props} />;
}
