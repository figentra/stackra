/**
 * Stackra file contract:
 * Purpose: `AppApprovalWaitOptions`, what `useAppApprovalWait` calls: `start` (the server's `AppApprovalService.request`)
 *          and `poll` (its `.status`), and the poll interval.
 * Boundary: a type only; the caller wires its generated client.
 * Runtime: isomorphic
 * Governing contract: STA-1304 (owner request 2026-10-27).
 */
import type { AppApprovalProgress, AppApprovalTicket } from "#core/index";

/** What the hook calls. */
export interface AppApprovalWaitOptions {
  /** Starts a challenge on the server. */
  readonly start: () => Promise<AppApprovalTicket>;

  /** Reads its progress. */
  readonly poll: (ticket: AppApprovalTicket) => Promise<AppApprovalProgress>;

  /** Milliseconds between polls; 2 s by default. */
  readonly intervalMs?: number;
}
