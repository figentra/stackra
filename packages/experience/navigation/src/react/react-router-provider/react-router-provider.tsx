/**
 * Stackra file contract:
 * Purpose: the web `ReactRouterProvider`: fills the `RouterProvider` seam of `@stackra/ui` with React Router 7's
 *          `useNavigate` and `useHref`, so every `Link` below it navigates on the client through the app's router and
 *          shows the router's own `href` (basename included), with no router import in `@stackra/ui`.
 * Boundary: context glue only; mount it once inside the router, around the app (or around any subtree whose links
 *           should reach that router). An external link keeps the browser's own navigation.
 * Runtime: browser
 * Governing contract: ADR 0317 (decision 2); ADR 0303 (decision 1: `@stackra/ui` is router-free); ADR 0165 (React
 *          Router 7 on web).
 */
import { RouterProvider } from "@stackra/ui/react";
import type { ReactElement } from "react";
import { useHref, useNavigate } from "react-router";

import type { ReactRouterProviderProps } from "#react/react-router-provider/react-router-provider.props";

/** A URL with a scheme (`https:`, `mailto:`) or a protocol-relative one: it leaves the app, so the router never owns it. */
const ABSOLUTE_URL = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;

/**
 * React Router's `useHref` for the app's own paths only. React Aria calls it for every link, and React Router would
 * read an absolute URL as a relative path under the basename.
 */
function useRouterHref(href: string): string {
  // Called on every render, whatever the href, so the hook order never changes.
  const resolved = useHref(href);
  return ABSOLUTE_URL.test(href) ? href : resolved;
}

/** Gives every `Link` below it React Router's navigate and href functions. */
export function ReactRouterProvider({ children }: ReactRouterProviderProps): ReactElement {
  const navigate = useNavigate();
  return (
    // oxlint-disable-next-line react/hooks -- React Aria's RouterProvider takes the router's `useHref` hook as a prop and calls it itself.
    <RouterProvider navigate={(href) => void navigate(href)} useHref={useRouterHref}>
      {children}
    </RouterProvider>
  );
}
