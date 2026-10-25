/**
 * Stackra file contract:
 * Purpose: `RootErrorBoundary`, the app-wide error boundary navigation owns: a 404 renders the not-found page with a
 *          way home in the visitor's mount, a 401 or 403 the matching error state, anything else the error state with
 *          its details (outside production) and a retry. Gen wires it at the root of every app; a route customises its
 *          own failure only with `<name>.error.tsx`.
 * Boundary: renders only, from `@stackra/ui`'s `EmptyState` and `ErrorState`. It needs no container (it renders even
 *           when the root that mounts the app's providers failed), so it never reports: the route adapters report an
 *           unexpected loader or submit error to the error reporter, and the app's entry reports render errors.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 35); ADR 0324 (nearest `.error.tsx` ancestor wins, navigation provides the
 *                     default); ADR 0303 (decision 1).
 */
import { EmptyState, ErrorState } from "@stackra/ui/react";
import type { ReactElement } from "react";
import { Link as RouterLink, useRouteError } from "react-router";

import { resolveHref } from "#core/functions/resolve-href.function";
import type { RootErrorBoundaryProps } from "#react/root-error-boundary/root-error-boundary.props";
import { statusOf } from "#react/root-error-boundary/status-of.function";

// shortcut: English until the package ships its `navigation::errors.*` catalogue and the boundary can read a translator
// without the app's providers (they may be what failed); swap in the keys then.
const STRINGS = {
  notFoundTitle: "Page not found",
  notFoundBody: "The page you asked for does not exist or has moved.",
  errorTitle: "Something went wrong",
  unauthenticatedTitle: "Sign in to continue",
  forbiddenTitle: "You do not have access to this page",
  home: "Go to the home page",
  retry: "Try again",
} as const;

/** The home link's href: the registered home route's path in the mount, else the mount's root. */
function homeHref(home: string | undefined, prefix: string): string {
  let path = "/";
  if (home !== undefined) {
    try {
      path = resolveHref({ name: home });
    } catch {
      path = "/"; // the home route is not registered: the mount's root is the safest way home
    }
  }
  if (prefix === "") return path;
  return path === "/" ? `${prefix}/` : `${prefix}${path}`;
}

/**
 * The root error boundary.
 *
 * @example
 * export function ErrorBoundary() {
 *   return <RootErrorBoundary home="landing" />;
 * }
 */
export function RootErrorBoundary({ home, prefix = "" }: RootErrorBoundaryProps): ReactElement {
  const error = useRouteError();
  const status = statusOf(error);
  const homeLink = <RouterLink to={homeHref(home, prefix)}>{STRINGS.home}</RouterLink>;
  if (status === 404)
    return (
      <EmptyState
        title={STRINGS.notFoundTitle}
        description={STRINGS.notFoundBody}
        actions={homeLink}
        headingLevel={1}
      />
    );
  const kind = status === 401 ? "unauthenticated" : status === 403 ? "forbidden" : "unexpected";
  const title =
    kind === "unauthenticated"
      ? STRINGS.unauthenticatedTitle
      : kind === "forbidden"
        ? STRINGS.forbiddenTitle
        : STRINGS.errorTitle;
  return (
    <ErrorState
      kind={kind}
      title={title}
      error={error}
      actions={homeLink}
      headingLevel={1}
      retry={{ label: STRINGS.retry, onPress: () => globalThis.location.reload() }}
    />
  );
}
