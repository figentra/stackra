/**
 * Stackra file contract:
 * Purpose: `useRouteClose()`, how a web route overlay leaves its route: back to the opener when the opener pushed the
 *          entry (`state.returnTo` is set), to `returnTo` when the overlay was opened by a deep link, and otherwise to
 *          the parent route with the search params kept, replacing the entry so Back does not reopen the overlay.
 * Boundary: React Router glue only; it never decides what is unsaved (a `useBlocker` does, in
 *           `RouteLeaveConfirmation`), so a blocked leave simply leaves the overlay open.
 * Runtime: browser
 * Governing contract: ADR 0317 (decision 2); the React Router 7 `useNavigate` contract.
 */
import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router";

import type { RouteOverlayState } from "#contracts/types/route-overlay-state.type";
import type { RouteClose } from "#react/route-overlay/route-close.type";

/** The close and complete functions of the route overlay in the current route. */
export function useRouteClose(): RouteClose {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as RouteOverlayState | null)?.returnTo;
  // React Router names the first entry of a session "default": there is nothing to step back to.
  const isFirstEntry = location.key === "default";
  const search = location.search;

  const close = useCallback(() => {
    if (returnTo) {
      if (isFirstEntry) void navigate(returnTo, { replace: true });
      else void navigate(-1);
      return;
    }
    // `..` resolves against the route hierarchy, so the overlay's route need not know its parent's path.
    void navigate({ pathname: "..", search }, { replace: true, relative: "route" });
  }, [navigate, returnTo, isFirstEntry, search]);

  const complete = useCallback(
    (to?: string) => {
      if (to) void navigate(to, { replace: true });
      else close();
    },
    [navigate, close],
  );

  return { close, complete };
}
