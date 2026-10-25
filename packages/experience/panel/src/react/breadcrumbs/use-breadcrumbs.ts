/**
 * Stackra file contract:
 * Purpose: `useBreadcrumbs()`, the panel's breadcrumb trail: the crumbs the matched routes and the resource pages publish,
 *          outermost first.
 * Boundary: reads the shell's state; empty outside a shell. Crumbs are ordered by the depth of their href, so a parent
 *           route's crumb comes before its child's whatever order their effects ran in; one crumb per href.
 * Runtime: browser
 * Governing contract: ADR 0164 (panel shell); ADR 0303 (decision 1).
 */
import { use, useMemo } from "react";

import type { Breadcrumb } from "#react/breadcrumbs/breadcrumb.type";
import { PanelContext } from "#react/panel-shell/panel-context";

/** The number of path segments of `href`. */
const depthOf = (href: string): number => href.split("/").filter(Boolean).length;

/**
 * The trail, outermost first.
 *
 * @example
 * const breadcrumbs = useBreadcrumbs();
 * breadcrumbs.map((crumb) => <Breadcrumbs.Item key={crumb.to} href={crumb.to}>{t(crumb.label)}</Breadcrumbs.Item>);
 */
export function useBreadcrumbs(): readonly Breadcrumb[] {
  const crumbs = use(PanelContext)?.crumbs;
  return useMemo(() => {
    const byHref = new Map<string, Breadcrumb>();
    for (const crumb of crumbs?.values() ?? []) byHref.set(crumb.to, crumb);
    return [...byHref.values()].sort((left, right) => depthOf(left.to) - depthOf(right.to));
  }, [crumbs]);
}
