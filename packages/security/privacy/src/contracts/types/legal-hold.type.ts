/**
 * Stackra file contract:
 * Purpose: `LegalHold`, one hold of the Postgres hold store as `ListHoldsQuery` returns it.
 * Boundary: a type only; times are ISO 8601 strings, ids are public ids.
 * Runtime: isomorphic
 * Governing contract: ADR 0134 (2026-10-24 amendment: holds); data-layer gap gov20 (stackra-332).
 */

/**
 * One legal hold.
 *
 * @example
 * const hold: LegalHold = { id: "lgh_01…", model: "Invoice", recordId: "inv_01…", reason: "Matter 2026-14", placedBy: "usr_01…", placedAt: "2026-10-28T09:00:00.000Z", releasedAt: null };
 */
export interface LegalHold {
  /** The hold's public id. */
  readonly id: string;

  /** The entity name of the held record's model. */
  readonly model: string;

  /** The held record's id, or a subject's public id. */
  readonly recordId: string;

  /** Why it was placed. */
  readonly reason: string;

  /** The principal who placed it; null for a system call. */
  readonly placedBy: string | null;

  /** When it was placed. */
  readonly placedAt: string;

  /** When it was released; null while it holds. */
  readonly releasedAt: string | null;
}
