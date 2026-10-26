/**
 * Stackra file contract:
 * Purpose: the web `RouteLeaveConfirmation`: `@stackra/ui`'s `LeaveConfirmation` wired to React Router. While `when` is
 *          true a navigation away from the page is held (`useBlocker`) and the "discard your changes?" dialog asks;
 *          Discard lets the navigation proceed and Stay cancels it. The tab-close prompt is `LeaveConfirmation`'s own
 *          `beforeunload` listener.
 * Boundary: renders `LeaveConfirmation` and the blocker, nothing else; the words are the caller's. `useBlocker` needs
 *           React Router's data router (`createBrowserRouter`, `createMemoryRouter`). One question is open at a time:
 *           a blocker that fires again while the dialog is open waits for the answer.
 * Runtime: browser
 * Governing contract: ADR 0317 (decision 2); ADR 0312; ADR 0055 (forms); WCAG 2.2 SC 3.3.4.
 */
import type { LeaveConfirmationHandle } from "@stackra/ui/contracts";
import { LeaveConfirmation } from "@stackra/ui/react";
import { useEffect, useRef, type ReactElement } from "react";
import { useBlocker } from "react-router";

import type { RouteLeaveConfirmationProps } from "#react/route-leave-confirmation/route-leave-confirmation.props";

/** Asks before a route change drops unsaved work: hold the navigation, ask, then proceed or reset. */
export function RouteLeaveConfirmation(props: RouteLeaveConfirmationProps): ReactElement {
  const leave = useRef<LeaveConfirmationHandle>(null);
  const isAsking = useRef(false);
  const blocker = useBlocker(props.when);

  useEffect(() => {
    if (blocker.state !== "blocked" || isAsking.current) return;
    isAsking.current = true;
    void (leave.current?.confirmLeave() ?? Promise.resolve(false)).then((mayLeave) => {
      isAsking.current = false;
      if (mayLeave) blocker.proceed();
      else blocker.reset();
    });
  }, [blocker]);

  return <LeaveConfirmation {...props} ref={leave} />;
}
