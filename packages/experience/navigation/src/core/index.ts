/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/navigation (the `Route`, `Layout` and `Menu` kinds, route refs and
 *          the route table, the context, props and menu types, `ChromeConfig`, the enums, `data`, the generated
 *          navigation and tabs builders, and the seams other packages contribute through) until `stackra gen` writes
 *          the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Isomorphic: no React, router or React Native import. The
 *           `RouteCaller` port is the `./contracts` entry's; the router adapters, links, hooks and the root error
 *           boundary are `./react`'s (the old `./router` entry is folded there, where the template imports it); the
 *           React Navigation adapters are `./native`'s. `RouteProps` is exported here only (registry A3).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { ChromeConfig } from "#config/chrome.config";
export { Layout } from "#core/bases/layout.base";
export { Menu } from "#core/bases/menu.base";
export { Route } from "#core/bases/route.base";
export { ChromeConfig$ } from "#core/constants/chrome-config-schema.constant";
export { BackTitle } from "#core/enums/back-title.enum";
export { HeaderStyle } from "#core/enums/header-style.enum";
export { MenuItemKind } from "#core/enums/menu-item-kind.enum";
export { MenuKind } from "#core/enums/menu-kind.enum";
export { Presentation } from "#core/enums/presentation.enum";
export { RenderMode } from "#core/enums/render-mode.enum";
export { contributeRouteContext } from "#core/functions/contribute-route-context.function";
export { data } from "#core/functions/data.function";
export { navigation } from "#core/functions/navigation.function";
export { registerDocumentResolver } from "#core/functions/register-document-resolver.function";
export { registerRoutes } from "#core/functions/register-routes.function";
export { routeRef } from "#core/functions/route-ref.function";
export { tabs } from "#core/functions/tabs.function";
export type { ChromeHeader } from "#core/types/chrome-header.type";
export type { ChromeTabBar } from "#core/types/chrome-tab-bar.type";
export type { DocumentResolver } from "#core/types/document-resolver.type";
export type { HrefParams } from "#core/types/href-params.type";
export type { InferParams } from "#core/types/infer-params.type";
export type { LayoutClass } from "#core/types/layout-class.type";
export type { LayoutContext } from "#core/types/layout-context.type";
export type { LayoutData } from "#core/types/layout-data.type";
export type { LayoutOptions } from "#core/types/layout-options.type";
export type { LoaderData } from "#core/types/loader-data.type";
export type { MenuBuilder } from "#core/types/menu-builder.type";
export type { MenuClass } from "#core/types/menu-class.type";
export type { MenuItem } from "#core/types/menu-item.type";
export type { MenuOptions } from "#core/types/menu-options.type";
export type { MetaContext } from "#core/types/meta-context.type";
export type { NavigationGroup } from "#core/types/navigation-group.type";
export type { NavigationItem } from "#core/types/navigation-item.type";
export type { NavigationTree } from "#core/types/navigation-tree.type";
export type { ParamsOf } from "#core/types/params-of.type";
export type { PathParams } from "#core/types/path-params.type";
export type { ResolvedMenuItem } from "#core/types/resolved-menu-item.type";
export type { ResolvedNavigationGroup } from "#core/types/resolved-navigation-group.type";
export type { RouteActionResult } from "#core/types/route-action-result.type";
export type { RouteCache } from "#core/types/route-cache.type";
export type { RouteChrome } from "#core/types/route-chrome.type";
export type { RouteClass } from "#core/types/route-class.type";
export type { RouteContext } from "#core/types/route-context.type";
export type { RouteContextMembers } from "#core/types/route-context-members.type";
export type { RouteContextPart } from "#core/types/route-context-part.type";
export type { RouteOptions } from "#core/types/route-options.type";
export type { RouteProps } from "#core/types/route-props.type";
export type { RouteQueryOptions } from "#core/types/route-query-options.type";
export type { RouteRedirect } from "#core/types/route-redirect.type";
export type { RouteRef } from "#core/types/route-ref.type";
export type { RouteResponse } from "#core/types/route-response.type";
export type { RouteResponseInit } from "#core/types/route-response-init.type";
export type { RouteServices } from "#core/types/route-services.type";
export type { RouteTab } from "#core/types/route-tab.type";
export type { RouteTarget } from "#core/types/route-target.type";
export type { RunnableMenu } from "#core/types/runnable-menu.type";
export type { SearchOf } from "#core/types/search-of.type";
export type { TabItem } from "#core/types/tab-item.type";
