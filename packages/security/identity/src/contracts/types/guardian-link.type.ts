/**
 * Stackra file contract:
 * Purpose: `GuardianLink`, the relationship that lets one person act for a minor: who, for whom, as what, what the
 *          guardian may not do (custody restrictions), and until when.
 * Boundary: a type only. The OS parties service owns the link and its restrictions (ACA-57, ACA-60); identity only
 *           reads it to let a guardian act.
 * Runtime: isomorphic
 * Governing contract: OS-284 (a guardian acting for a minor); ADR 0361 (decision 3); ACA-57, ACA-60.
 */
import type { PublicId } from "@stackra/contracts";

/** A guardian link. */
export interface GuardianLink {
  /** The guardian's principal. */
  readonly guardian: PublicId;

  /** The minor's principal. */
  readonly minor: PublicId;

  /** How they are related (`parent`, `legal_guardian`). */
  readonly relationship: string;

  /** Purposes the guardian may not act for (`pickup`, `payments`, `medical`); empty for none. */
  readonly restrictions: readonly string[];

  /** When the link ends; absent until ended. */
  readonly until?: Date;
}
