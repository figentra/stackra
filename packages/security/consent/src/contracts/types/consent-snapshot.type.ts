/**
 * Stackra file contract:
 * Purpose: `ConsentSnapshot`, the signed, short-lived copy of a visitor's consent decision that travels with server
 *          calls and analytics ingest batches (ADR 0472): its id, its subject, the policy version, the categories
 *          granted and refused, the regime and region that applied, whether Global Privacy Control was sent, and when
 *          it was decided, issued and expires.
 * Boundary: a type only, in this leaf entry, so categories and the regime are their codes as strings. It is the
 *           payload a `ConsentSnapshotIssuer` signs and a `ConsentSnapshotVerifier` reads back; on the wire it is the
 *           compact token (payload, key id, signature), never this object. It holds no personal data beyond `subject`
 *           and is never stored as evidence (ADR 0472 decision 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0472 (decision 2); ADR 0298 (decisions 1 to 4); ADR 0294 (decision 15).
 */

/** One signed consent snapshot. */
export interface ConsentSnapshot {
  /** The snapshot's id (`csn_` public id); events derived from a call carry it. */
  readonly id: string;

  /** Who it was issued for: the analytics anonymous id, the principal, or a random id. */
  readonly subject: string;

  /** The `ConsentConfig.policyVersion` the decision answered; another version reads as refused. */
  readonly policyVersion: string;

  /** The category codes granted, the required ones included. */
  readonly granted: readonly string[];

  /** The optional category codes not granted (refused or undecided). */
  readonly refused: readonly string[];

  /** The `ConsentRegime` code that applied before the decision. */
  readonly regime: string;

  /** The visitor's region code, or `null` when unknown. */
  readonly region: string | null;

  /** Whether the browser sent Global Privacy Control; such a snapshot always reads as refused. */
  readonly globalPrivacyControl: boolean;

  /** When the decision was made (ISO 8601), or `null` when the visitor has not decided. */
  readonly decidedAt: string | null;

  /** When the snapshot was signed (ISO 8601). */
  readonly issuedAt: string;

  /** When it stops counting (ISO 8601); never after the decision expires. */
  readonly expiresAt: string;
}
