/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./react` entry: every symbol the template imports from
 *          `@stackra/navigation/react` (the links and hooks, `Outlet`, `RouteForm`, the root boundary and the old
 *          `./router` adapters folded here) plus `registerRoutePages` and the breadcrumb trail panel's shell re-uses,
 *          and nothing else.
 * Boundary: test only; imports the stand-in barrel through its `#react` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15); ADR 0303 (decision 1).
 */
import { describe, expect, it } from "vitest";
import { Form, Outlet } from "react-router";

import * as react from "#react/index";

describe("@stackra/navigation/react", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(react).sort()).toEqual([
      "BreadcrumbsProvider",
      "Link",
      "NavLink",
      "Outlet",
      "ROUTE_OVERLAY_MAX_DEPTH",
      "ReactRouterProvider",
      "RootErrorBoundary",
      "RouteForm",
      "RouteLeaveConfirmation",
      "RouteOverlay",
      "registerRoutePages",
      "routeAdapter",
      "routeContext",
      "toLayout",
      "toPanel",
      "toResource",
      "toRoot",
      "toRoute",
      "toSettingsPage",
      "useBreadcrumb",
      "useBreadcrumbs",
      "useHref",
      "useLayoutData",
      "useLocaleHref",
      "useMenu",
      "useNavigate",
      "useNavigation",
      "useRouteOverlay",
      "useSubmit",
    ]);
  });

  it("re-exports React Router's outlet and form", () => {
    expect(react.Outlet).toBe(Outlet);
    expect(react.RouteForm).toBe(Form);
  });
});
