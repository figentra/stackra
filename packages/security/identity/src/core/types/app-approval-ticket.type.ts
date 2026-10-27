/**
 * Stackra file contract:
 * Purpose: `AppApprovalTicket`, what the requesting device gets back once: the challenge id, the poll secret it reads
 *          the status and completes with, the number to show, the QR token to draw, and when it lapses.
 * Boundary: a type only. The poll secret and the QR token are credentials while they live: kept on the requesting
 *           page, never logged; the store holds their hashes only. A ticket looks the same whether the account exists.
 * Runtime: isomorphic
 * Governing contract: STA-1304 (owner request 2026-10-27).
 */

/** One started challenge, as the requester sees it. */
export interface AppApprovalTicket {
  /** The challenge id the requester polls and completes. */
  readonly id: string;

  /** The secret the requester polls and completes with. */
  readonly pollSecret: string;

  /** The number to show ("check your phone"). */
  readonly number: number;

  /** The one-time token the QR code carries. */
  readonly qrToken: string;

  /** When it lapses. */
  readonly expiresAt: Date;
}
