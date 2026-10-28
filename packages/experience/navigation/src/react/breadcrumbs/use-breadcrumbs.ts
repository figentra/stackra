/**
 * Stackra file contract:
 * Purpose: `useBreadcrumbs()`, the breadcrumb trail: the crumbs the matched routes and the resource pages publish,
 *          outermost first.
 * Boundary: reads the nearest `BreadcrumbsProvider`'s state; empty outside one. Crumbs are ordered by the depth of
 *           their href, so a parent route's crumb comes before its child's whatever order their effects ran in; one
 *           crumb per href.
 * Runtime: browser
 * Governing contract: ADR 0164 (the panel shell's trail); ADR 0303 (decision 1).
 */
import { use, useMemo } from "react";

import type { Breadcrumb } from "#react/breadcrumbs/breadcrumb.type";
import { BreadcrumbsContext } from "#react/breadcrumbs/breadcrumbs-context";

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
  const crumbs = use(BreadcrumbsContext)?.crumbs;
  return useMemo(() => {
    const byHref = new Map<string, Breadcrumb>();
    for (const crumb of crumbs?.values() ?? []) byHref.set(crumb.to, crumb);
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    return [...byHref.values()].sort((left, right) => depthOf(left.to) - depthOf(right.to));
  }, [crumbs]);
}
