/**
 * Stackra file contract:
 * Purpose: `Link`, the router-aware link: `<Link to={Routes.product} params={{ slug }}>` renders an `<a>` to the
 *          target's href in the visitor's locale mount and navigates on the client; it is what a `Button`'s `render`
 *          prop takes (`<Button render={<Link to={Routes.dashboard} />}>`).
 * Boundary: React Router's `Link` with the resolved href; every other prop passes through. `@stackra/ui` stays
 *           router-free (ADR 0303 decision 1).
 * Runtime: browser
 * Governing contract: ADR 0303 (decision 1); ADR 0297 (decision 4); registry R-56 (no raw route strings).
 */
import type { ReactElement } from "react";
import { Link as RouterLink } from "react-router";

import { useHref } from "#react/href/use-href";
import type { LinkProps } from "#react/link/link.props";

/**
 * A link to a route, a settings page, a resource or a URL.
 *
 * @example
 * <Link to={Routes.store} search={{ collection: collection.slug }}>{collection.title}</Link>
 */
export function Link({ to, params, search, hash, ...rest }: LinkProps): ReactElement {
  const href = useHref(to, { ...params, search, hash });
  return <RouterLink {...rest} to={href} />;
}
