/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/navigation (router-aware links and hooks, the breadcrumb
 *          trail, the root error boundary, and the React Router 7 adapters: the data-route builders of a
 *          client-rendered app and the framework-mode route module bindings; the old `./router` entry is folded here)
 *          until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. `Outlet` and `RouteForm` are React Router's own, re-exported so
 *           an app imports routing UI from here only. Imports `.` internals one way; nothing here is React Native.
 * Runtime: browser
 * Governing contract: ADR 0317 (route overlay); ADR 0294 (decision 15); ADR 0303 (decision 1); ADR 0165; the STA-347 stand-in barrel decision.
 */
export { Outlet, Form as RouteForm } from "react-router";
export type { Breadcrumb } from "#react/breadcrumbs/breadcrumb.type";
export { BreadcrumbsProvider } from "#react/breadcrumbs/breadcrumbs-provider";
export { useBreadcrumb } from "#react/breadcrumbs/use-breadcrumb";
export { useBreadcrumbs } from "#react/breadcrumbs/use-breadcrumbs";
export { useHref } from "#react/href/use-href";
export { useLayoutData } from "#react/layout-data/use-layout-data";
export { Link } from "#react/link/link";
export type { LinkProps } from "#react/link/link.props";
export { useLocaleHref } from "#react/locale-href/use-locale-href";
export { useMenu } from "#react/menu/use-menu";
export { NavLink } from "#react/nav-link/nav-link";
export type { NavLinkProps } from "#react/nav-link/nav-link.props";
export type { NavigateOptions } from "#react/navigate/navigate-options.type";
export { useNavigate } from "#react/navigate/use-navigate";
export { useNavigation } from "#react/navigation/use-navigation";
export { RootErrorBoundary } from "#react/root-error-boundary/root-error-boundary";
export type { RootErrorBoundaryProps } from "#react/root-error-boundary/root-error-boundary.props";
export { routeAdapter } from "#react/route-adapter/route-adapter.function";
export type { RouteAdapter } from "#react/route-adapter/route-adapter.type";
export type { RouteAdapterOptions } from "#react/route-adapter/route-adapter-options.type";
export { routeContext } from "#react/route-context/route-context.function";
export type { RouteModuleContext } from "#react/route-context/route-module-context.type";
export type { RouteKeys } from "#react/route-keys/route-keys.type";
export { toLayout } from "#react/route-objects/to-layout.function";
export { toPanel } from "#react/route-objects/to-panel.function";
export { toResource } from "#react/route-objects/to-resource.function";
export { toRoot } from "#react/route-objects/to-root.function";
export { toRoute } from "#react/route-objects/to-route.function";
export { toSettingsPage } from "#react/route-objects/to-settings-page.function";
export { registerRoutePages } from "#react/route-pages/register-route-pages.function";
export type { RoutePages } from "#react/route-pages/route-pages.type";
export type { RouteSubmit } from "#react/submit/route-submit.type";
export { useSubmit } from "#react/submit/use-submit";
export { ReactRouterProvider } from "#react/react-router-provider/react-router-provider";
export type { ReactRouterProviderProps } from "#react/react-router-provider/react-router-provider.props";
export { RouteLeaveConfirmation } from "#react/route-leave-confirmation/route-leave-confirmation";
export type { RouteLeaveConfirmationProps } from "#react/route-leave-confirmation/route-leave-confirmation.props";
export { RouteOverlay } from "#react/route-overlay/route-overlay";
export type { RouteOverlayProps } from "#react/route-overlay/route-overlay.props";
export { useRouteOverlay } from "#react/route-overlay/use-route-overlay";
