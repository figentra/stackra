/**
 * Stackra file contract:
 * Purpose: `VerifiedAward`, what a verify token resolves to: the live award it was issued with, its kind's name, level,
 *          period, recipient and when it was granted.
 * Boundary: a type only, and JSON as it is. It names the recipient by model key and public id, never by name: the
 *           public page a consumer builds from it decides what a stranger may see (a minor's first name only, say).
 * Runtime: isomorphic
 * Governing contract: ADR 0368 (decision 5); ADR 0135 (public ids).
 */
import type { PublicId } from "@stackra/contracts";

import type { RecipientRef } from "#contracts/types/recipient-ref.type";

/**
 * A verified award.
 *
 * @example
 * const verified = await awards.verify(token); // null when unknown or revoked
 */
export interface VerifiedAward {
  /** The award's public id. */
  readonly awardId: PublicId<"awd">;

  /** Its kind's public id. */
  readonly kindId: PublicId<"awk">;

  /** Its kind's display name. */
  readonly kindName: string;

  /** The level granted; null for a kind with no levels. */
  readonly level: string | null;

  /** The period granted for; null for a kind that is not once per period. */
  readonly period: string | null;

  /** The record it was granted to. */
  readonly recipient: RecipientRef;

  /** When it was granted. */
  readonly grantedAt: Date;
}
