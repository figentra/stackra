/**
 * Stackra file contract:
 * Purpose: `AppApprovalWait`, what `useAppApprovalWait` returns: the phase, the started ticket (its number and QR
 *          token, and what the page completes with), the failure, and `restart`.
 * Boundary: a type only. No text: the page renders the words from its own lang keys.
 * Runtime: isomorphic
 * Governing contract: STA-1304 (owner request 2026-10-27).
 */
import type { AppApprovalTicket } from "#core/index";
import type { AppApprovalWaitPhase } from "#react/app-approval/app-approval-wait-phase.type";

/** The waiting screen's state. */
export interface AppApprovalWait {
  /** Where the wait stands. */
  readonly phase: AppApprovalWaitPhase;

  /** The started ticket: its number to show, its QR token to draw, and what the page completes with. */
  readonly ticket: AppApprovalTicket | null;

  /** The failure, when `phase` is `failed`. */
  readonly error: unknown;

  /** Asks again with a fresh challenge. */
  readonly restart: () => void;
}
