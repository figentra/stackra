/**
 * Stackra file contract:
 * Purpose: `NavLink`, the router-aware navigation link: like `Link`, and marked `aria-current="page"` with an
 *          `isActive` class while its target is the current page (`end` for an exact match, a home link).
 * Boundary: React Router's `NavLink` with the resolved href; every other prop passes through.
 * Runtime: browser
 * Governing contract: ADR 0303 (decision 1); ADR 0297 (decision 4); WCAG 2.2 SC 2.4.8.
 */
import type { ReactElement } from "react";
import { NavLink as RouterNavLink } from "react-router";

import { useHref } from "#react/href/use-href";
import type { NavLinkProps } from "#react/nav-link/nav-link.props";

/**
 * A navigation link that knows when it is current.
 *
 * @example
 * <NavLink to={item.to} end={item.end} className={({ isActive }) => (isActive ? "font-medium" : "")}>
 */
export function NavLink({ to, params, search, hash, ...rest }: NavLinkProps): ReactElement {
  const href = useHref(to, { ...params, search, hash });
  return <RouterNavLink {...rest} to={href} />;
}
