/**
 * Stackra file contract:
 * Purpose: `RouteContext<T>`, what a route's or layout's `loader(ctx)` and `submit(ctx)` receive, written
 *          `RouteContext<this>`: the navigation-owned members, the members other packages contribute, and the data the
 *          route's layout resolved (`ctx.site` under `SiteLayout`).
 * Boundary: a type only; built per request by the adapters (`createRouteContext`).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 17).
 */
import type { LayoutData } from "#core/types/layout-data.type";
import type { RouteContextMembers } from "#core/types/route-context-members.type";
import type { RouteServices } from "#core/types/route-services.type";

/** The context of route or layout instance `T`. */
export type RouteContext<T> = RouteContextMembers<T> & RouteServices & LayoutData<T>;
