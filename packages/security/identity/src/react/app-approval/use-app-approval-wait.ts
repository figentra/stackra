/**
 * Stackra file contract:
 * Purpose: `useAppApprovalWait`, the web's waiting screen for an app approval ("check your phone"): it starts the
 *          challenge, exposes the number and the QR token to draw, polls until the app answers, and settles on
 *          `approved` (the page then completes the ticket) or `ended`.
 * Boundary: data only, no text: the page renders the words from its own lang keys. The calls go through the caller's
 *           `start` and `poll` (its generated client for `AppApprovalService.request` and `.status`), because the
 *           challenge lives on the server; the latest functions are read per call, so inline ones start one challenge
 *           only. It stops polling at the ticket's expiry, on an answer and on unmount, and `restart` asks again. A
 *           failed call ends the wait as `failed` with the error.
 * Runtime: isomorphic
 * Governing contract: STA-1304 (owner request 2026-10-27); ADR 0294 (decision 17).
 */
import { useCallback, useEffect, useRef, useState } from "react";

import type { AppApprovalTicket } from "#core/index";
import type { AppApprovalWait } from "#react/app-approval/app-approval-wait.type";
import type { AppApprovalWaitOptions } from "#react/app-approval/app-approval-wait-options.type";

/** The state before a ticket. */
const STARTING: Omit<AppApprovalWait, "restart"> = {
  phase: "starting",
  ticket: null,
  error: undefined,
};

/**
 * The waiting screen's state.
 *
 * @example
 * const wait = useAppApprovalWait({ start: () => api.appApproval.request(input), poll: (t) => api.appApproval.status(t) });
 * if (wait.phase === "approved" && wait.ticket) await api.appApproval.complete(wait.ticket);
 * return <Text>{wait.ticket?.number}</Text>;
 */
export function useAppApprovalWait(options: AppApprovalWaitOptions): AppApprovalWait {
  const calls = useRef(options);
  useEffect(() => {
    calls.current = options;
  });
  const [round, setRound] = useState(0);
  const [state, setState] = useState(STARTING);

  useEffect(() => {
    let live = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const fail = (error: unknown) => {
      if (live) setState((previous) => ({ ...previous, phase: "failed", error }));
    };
    const later = (ticket: AppApprovalTicket) => {
      timer = setTimeout(() => tick(ticket), calls.current.intervalMs ?? 2000);
    };
    const tick = (ticket: AppApprovalTicket) => {
      if (Date.now() >= ticket.expiresAt.getTime()) {
        setState({ phase: "ended", ticket, error: undefined });
        return;
      }
      calls.current.poll(ticket).then((progress) => {
        if (!live) return;
        setState({ phase: progress, ticket, error: undefined });
        if (progress === "pending") later(ticket);
      }, fail);
    };
    calls.current.start().then((ticket) => {
      if (!live) return;
      setState({ phase: "pending", ticket, error: undefined });
      later(ticket);
    }, fail);
    return () => {
      live = false;
      if (timer !== undefined) clearTimeout(timer);
    };
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- reason: `round` is the restart trigger
  }, [round]);

  const restart = useCallback(() => {
    setState(STARTING);
    setRound((value) => value + 1);
  }, []);
  return { ...state, restart };
}
