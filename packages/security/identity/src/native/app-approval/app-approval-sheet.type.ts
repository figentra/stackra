/**
 * Stackra file contract:
 * Purpose: `AppApprovalSheet`, what `useAppApprovalSheet` returns: the pending prompts with the requester's details,
 *          whether a call runs, the last failure, and `refresh`, `approve`, `deny` and `scan`.
 * Boundary: a type only. No text: the sheet renders the words from the app's lang keys.
 * Runtime: react-native
 * Governing contract: STA-1304 (owner request 2026-10-27).
 */
import type { AppApprovalPrompt } from "#core/index";

/** The approve sheet's state. */
export interface AppApprovalSheet {
  /** The pending prompts, newest first; a scanned one first of all. */
  readonly prompts: readonly AppApprovalPrompt[];

  /** Whether a load or an answer is running. */
  readonly busy: boolean;

  /** The last failure, cleared by the next call. */
  readonly error: unknown;

  /** Reloads the list (on a push, or on focus). */
  readonly refresh: () => Promise<void>;

  /** Verifies, then approves; `false` when the check was refused or the number was wrong. */
  readonly approve: (id: string, number?: number) => Promise<boolean>;

  /** Denies. */
  readonly deny: (id: string) => Promise<void>;

  /** Redeems a scanned QR token and puts its prompt first. */
  readonly scan: (qrToken: string) => Promise<void>;
}
