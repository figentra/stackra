/**
 * Stackra file contract:
 * Purpose: `AppApprovalChallenge`, one app approval as stored: what it is for, who asked, the account it targets, the
 *          number to match and the choices the app offers, the hashes of the requester's poll secret and of the QR
 *          token, its status and its times.
 * Boundary: a type only, written and read through `AppApprovalChallenges`. The poll secret and the QR token are stored
 *           as SHA-256 hashes only. `principal` is absent while nobody is known (a QR sign-in before the scan, or a
 *           login hint that matched no account, which then can never be approved and simply lapses).
 * Runtime: isomorphic
 * Governing contract: STA-1304 (owner request 2026-10-27); ADR 0207 (decision 1).
 */
import type { PublicId } from "@stackra/contracts";

import type { AppApprovalPurpose } from "#contracts/enums/app-approval-purpose.enum";
import type { AppApprovalStatus } from "#contracts/enums/app-approval-status.enum";
import type { AppApprovalRequester } from "#contracts/types/app-approval-requester.type";

/** One stored challenge. */
export interface AppApprovalChallenge {
  /** The challenge's opaque id. */
  readonly id: string;

  /** Sign-in or step-up. */
  readonly purpose: AppApprovalPurpose;

  /** Who asked. */
  readonly requester: AppApprovalRequester;

  /** The rate-limit key of the target: the normalised login hint, else the principal, else the requesting device. */
  readonly target: string;

  /** The account it targets, once known. */
  readonly principal?: PublicId<"usr">;

  /** The requesting session a step-up raises. */
  readonly sessionId?: string;

  /** The number the requesting device shows. */
  readonly number: number;

  /** The number and the decoys, in the order the app shows them. */
  readonly choices: readonly number[];

  /** SHA-256 hex of the requester's poll secret. */
  readonly pollHash: string;

  /** SHA-256 hex of the one-time QR token. */
  readonly tokenHash: string;

  /** Whether the app already redeemed the QR token (then no number is asked). */
  readonly scanned: boolean;

  /** Where it stands. */
  readonly status: AppApprovalStatus;

  /** When it was asked for. */
  readonly createdAt: Date;

  /** When it lapses if nobody answers, and the last moment an approval can be completed. */
  readonly expiresAt: Date;

  /** The device that approved or denied it. */
  readonly answeredBy?: string;

  /** When it was approved or denied. */
  readonly answeredAt?: Date;
}
