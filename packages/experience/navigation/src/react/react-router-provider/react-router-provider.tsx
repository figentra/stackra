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
import type { ReactElement, ReactNode } from "react";
import { useHref, useNavigate } from "react-router";

/** Props of {@link ReactRouterProvider}. */
export interface ReactRouterProviderProps {
  /** The tree whose links navigate through React Router. */
  readonly children?: ReactNode;
}

/** Gives every `Link` below it React Router's navigate and href functions. */
export function ReactRouterProvider({ children }: ReactRouterProviderProps): ReactElement {
  const navigate = useNavigate();
  return (
    // oxlint-disable-next-line react/hooks -- React Aria's RouterProvider takes the router's `useHref` hook as a prop and calls it itself.
    <RouterProvider navigate={(href) => void navigate(href)} useHref={useHref}>
      {children}
    </RouterProvider>
  );
}
