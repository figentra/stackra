/**
 * Stackra file contract:
 * Purpose: `AppApprovalPrompt`, what the app's approve sheet shows for one pending challenge: the purpose, the
 *          requester's device, IP, coarse location and user agent (so the user spots a request that is not theirs),
 *          the numbers to pick from, and when it lapses.
 * Boundary: a type only, shown to the account holder only. `choices` is empty after a QR scan (no number is asked).
 *           The right number is never in it as such: the user reads it off the requesting screen.
 * Runtime: isomorphic
 * Governing contract: STA-1304 (owner request 2026-10-27); ADR 0134.
 */
import type { AppApprovalPurpose, AppApprovalRequester } from "#contracts/index";

/** One pending challenge, as the app sees it. */
export interface AppApprovalPrompt {
  /** The challenge. */
  readonly id: string;

  /** Sign-in or step-up. */
  readonly purpose: AppApprovalPurpose;

  /** Who asked. */
  readonly requester: AppApprovalRequester;

  /** The numbers to pick from; empty when the app scanned the QR code. */
  readonly choices: readonly number[];

  /** When it was asked for. */
  readonly createdAt: Date;

  /** When it lapses. */
  readonly expiresAt: Date;
}
